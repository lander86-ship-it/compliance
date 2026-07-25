// ControlForge / HardenHub — document generation engine (§7, FR-G-01..05, FR-C-23..25).
// Combines Product controls + customer Scope + Branding into DOCX / PDF / XLSX artifacts,
// embeds a watermark + license id, computes a verifiable sha256 hash, and stores the file.

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType,
} from "docx";
import { PDFDocument, StandardFonts, rgb, degrees, type PDFFont } from "pdf-lib";
import ExcelJS from "exceljs";
import { WINDOWS_CONTROLS, substituteOdp, type FullControl } from "./hub/controlContent";
import { isStigProduct, loadStig, toFullControl, STIG_PRODUCTS } from "./hub/stig";
import { buildPolicyDocx } from "./policy";
import { resolveNarrative } from "./policyNarrative";
import { injectPolicyIntoDocx, injectPolicyIntoPdf } from "./policyTemplate";
import { policyBlocks, type Block, type PolicyMeta } from "./policyContent";
import { connector } from "./sources";
import type { SourceId } from "./hub/data";

export type GenInput = {
  productId: string;
  productName?: string;
  scope: {
    legal: string; trade: string; sector: string; owner: string;
    docv: string; classification: string; color: string; env: string; profile: string;
    confidentiality?: string;
  };
  odp: Record<string, string>;
  excluded: { controlId: string; reason: string }[];
  included: string[];
  formats: string[];
  // Optional customer house-style template: the POLICY deliverable is rendered inside it.
  template?: { base64: string; type: "docx" | "pdf"; name?: string };
  // Live source selection (preferred). When present, controls are fetched on demand
  // from the source connector instead of the baked productId dataset.
  source?: SourceId;
  guideRef?: string; // opaque id the connector understands
  guideName?: string;
};

export type DocMeta = { title: string; benchmark: string; source: string };

export type ResolvedRow = FullControl & { status: "included" | "excluded"; reason?: string; remediationResolved: string };
export type ArtifactMeta = { format: string; url: string; fileName: string; hash: string; bytes: number; licenseId: string };

const STORAGE = process.env.STORAGE_DIR || "./storage";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

// The control source for a product: real DISA STIG data, or the demo CIS-mapped set.
export function sourceControls(productId: string): FullControl[] {
  if (isStigProduct(productId)) {
    const doc = loadStig(STIG_PRODUCTS[productId].slug);
    if (doc) return doc.controls.map(toFullControl);
  }
  return WINDOWS_CONTROLS;
}

// Deliverable title + benchmark line + provenance note, per product.
export function docMeta(productId: string): { title: string; benchmark: string; source: string } {
  if (isStigProduct(productId)) {
    const p = STIG_PRODUCTS[productId];
    const doc = loadStig(p.slug);
    return {
      title: `${p.name.replace(/^DISA STIG — /, "")} — Security Baseline`,
      benchmark: `${doc?.benchTitle || p.name} ${p.version}`,
      source: "Sourced from the DISA Security Technical Implementation Guide (U.S. Government, public domain) and cross-mapped to NIST 800-53.",
    };
  }
  return {
    title: "Windows Server 2022 Hardening Standard",
    benchmark: "CIS Windows Server 2022 Benchmark v2.0.0",
    source: "Control text is original and cross-mapped to NIST 800-53, NIST CSF and ISO 27002.",
  };
}

// Load the control set + document meta for a job: from the live source connector
// (preferred) or the baked productId dataset (demo/legacy).
async function loadJob(input: GenInput): Promise<{ controls: FullControl[]; meta: DocMeta; platform: string; benchVersion: string }> {
  if (input.source && input.guideRef) {
    const g = await connector(input.source).fetch(input.guideRef);
    const bench = `${g.benchTitle}${g.label ? ` ${g.label}` : ""}`;
    const src =
      input.source === "disa"
        ? "Sourced live from the DISA Security Technical Implementation Guide (U.S. Government, public domain) and cross-mapped to NIST 800-53."
        : "Sourced live from the CIS Benchmark via CIS WorkBench under your organisation's SecureSuite licence.";
    return {
      controls: g.controls,
      meta: { title: `${g.benchTitle} — Security Baseline`, benchmark: bench, source: src },
      platform: g.benchTitle,
      benchVersion: g.label,
    };
  }
  return {
    controls: sourceControls(input.productId),
    meta: docMeta(input.productId),
    platform: STIG_PRODUCTS[input.productId]?.platform || "",
    benchVersion: STIG_PRODUCTS[input.productId]?.version || "",
  };
}

// Step 1: resolve applicability (FR-A-11) + Step 2: substitute ODP values.
function applicability(input: GenInput, controls: FullControl[]): ResolvedRow[] {
  const exMap = new Map(input.excluded.map((e) => [e.controlId, e.reason]));
  return controls.map((c) => {
    const excluded = exMap.has(c.id);
    return {
      ...c,
      status: excluded ? "excluded" : "included",
      reason: excluded ? exMap.get(c.id) : undefined,
      remediationResolved: substituteOdp(c.remediation, input.odp),
    } as ResolvedRow;
  });
}

// Baked-only synchronous resolve (kept for compatibility with legacy callers).
export function resolve(input: GenInput): ResolvedRow[] {
  return applicability(input, sourceControls(input.productId));
}

// Full async resolve: fetches controls (live or baked) + document meta, then applies scope.
async function resolveRows(input: GenInput): Promise<{ rows: ResolvedRow[]; meta: DocMeta; platform: string; benchVersion: string }> {
  const job = await loadJob(input);
  return { rows: applicability(input, job.controls), meta: job.meta, platform: job.platform, benchVersion: job.benchVersion };
}

// ─────────────────────────── DOCX ───────────────────────────
async function buildDocx(input: GenInput, rows: ResolvedRow[], meta: DocMeta, licenseId: string, generatedAt: string): Promise<Buffer> {
  const brand = input.scope.color.replace("#", "");
  const included = rows.filter((r) => r.status === "included");
  const excluded = rows.filter((r) => r.status === "excluded");

  const cell = (text: string, opts: { bold?: boolean; head?: boolean; width?: number } = {}) =>
    new TableCell({
      width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
      shading: opts.head ? { type: ShadingType.CLEAR, color: "auto", fill: "F1F2EA" } : undefined,
      children: [new Paragraph({ children: [new TextRun({ text, bold: opts.bold || opts.head, size: 18 })] })],
    });

  const controlBlocks = included.flatMap((c) => [
    new Paragraph({ spacing: { before: 240, after: 60 }, children: [new TextRun({ text: `${c.id}  ${c.title}`, bold: true, size: 24, color: brand })] }),
    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `Severity: ${c.severity}   ·   Profile: ${c.profile}   ·   CIS↔NIST ${c.nist} · CSF ${c.csf} · ISO ${c.iso}`, size: 16, color: "79716B" })] }),
    new Paragraph({ children: [new TextRun({ text: "Rationale. ", bold: true, size: 18 }), new TextRun({ text: c.rationale, size: 18 })] }),
    new Paragraph({ children: [new TextRun({ text: "Audit. ", bold: true, size: 18 }), new TextRun({ text: c.audit, size: 18 })] }),
    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "Remediation. ", bold: true, size: 18 }), new TextRun({ text: c.remediationResolved, size: 18 })] }),
  ]);

  const applicabilityRows = [
    new TableRow({ children: [cell("Control", { head: true, width: 18 }), cell("Title", { head: true, width: 52 }), cell("Status", { head: true, width: 15 }), cell("Justification", { head: true, width: 15 })] }),
    ...rows.map((r) => new TableRow({ children: [cell(r.id), cell(r.title), cell(r.status === "included" ? "Included" : "Excluded"), cell(r.reason || "—")] })),
  ];

  const doc = new Document({
    creator: "HardenHub",
    title: meta.title,
    description: `License ${licenseId}`,
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ spacing: { before: 1200 }, children: [new TextRun({ text: input.scope.legal, bold: true, size: 28, color: brand })] }),
          new Paragraph({ spacing: { before: 200, after: 120 }, children: [new TextRun({ text: meta.title, bold: true, size: 56, color: brand })] }),
          new Paragraph({ children: [new TextRun({ text: `${meta.benchmark}  ·  Profile ${input.scope.profile}  ·  ${input.scope.env}`, size: 22, color: "57534E" })] }),
          new Paragraph({ spacing: { before: 600 }, children: [new TextRun({ text: `Classification: ${input.scope.classification}`, size: 20 })] }),
          new Paragraph({ children: [new TextRun({ text: `Document version: ${input.scope.docv}   ·   Date: ${generatedAt}`, size: 20 })] }),
          new Paragraph({ children: [new TextRun({ text: `Owner: ${input.scope.owner}`, size: 20 })] }),
          new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: `License ID: ${licenseId}  —  ${input.scope.confidentiality || "Confidential. Do not distribute."}`, italics: true, size: 16, color: "79716B" })] }),

          new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "1. Executive summary" })] }),
          new Paragraph({ children: [new TextRun({ text: `This baseline adapts the ${meta.benchmark} to ${input.scope.legal}. Of ${rows.length} candidate controls, ${included.length} are included and ${excluded.length} are excluded with recorded justification. ${meta.source}`, size: 20 })] }),

          new Paragraph({ spacing: { before: 240 }, heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "2. Applicability matrix" })] }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "E7E6E5" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "E7E6E5" }, left: { style: BorderStyle.SINGLE, size: 1, color: "E7E6E5" }, right: { style: BorderStyle.SINGLE, size: 1, color: "E7E6E5" }, insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "EFEEEC" }, insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "EFEEEC" } }, rows: applicabilityRows }),

          new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "3. Controls" })] }),
          ...controlBlocks,
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}

// ─────────────────────────── PDF ───────────────────────────
async function buildPdf(input: GenInput, rows: ResolvedRow[], meta: DocMeta, licenseId: string, generatedAt: string): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const brand = hexToRgb(input.scope.color);
  const ink = rgb(0.11, 0.1, 0.09);
  const muted = rgb(0.34, 0.33, 0.31);
  const MARGIN = 56;
  const WIDTH = 595.28;
  const HEIGHT = 841.89;

  let page = pdf.addPage([WIDTH, HEIGHT]);
  let y = HEIGHT - MARGIN;

  const watermark = (p: typeof page) => {
    p.drawText("HARDENHUB", { x: 90, y: 380, size: 60, font: bold, color: rgb(brand.r, brand.g, brand.b), opacity: 0.05, rotate: degrees(-20) });
    p.drawText(licenseId, { x: MARGIN, y: 28, size: 8, font, color: muted });
    p.drawText(input.scope.classification, { x: WIDTH - MARGIN - font.widthOfTextAtSize(input.scope.classification, 8), y: 28, size: 8, font, color: muted });
  };
  const newPage = () => { page = pdf.addPage([WIDTH, HEIGHT]); watermark(page); y = HEIGHT - MARGIN; };

  // pdf-lib standard fonts use WinAnsi, which can't encode arrows/em-dashes/smart quotes.
  const clean = (t: string): string =>
    t
      .replace(/[→⇒]/g, "->")
      .replace(/[—–]/g, "-")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/…/g, "...")
      .replace(/[•]/g, "-")
      .replace(/[^\x00-\xFF]/g, "");

  const wrap = (text: string, f: PDFFont, size: number, maxW: number): string[] => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(test, size) > maxW && line) { lines.push(line); line = w; } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  };
  const write = (text: string, opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; gap?: number; indent?: number } = {}) => {
    const size = opts.size ?? 10;
    const f = opts.font ?? font;
    const x = MARGIN + (opts.indent ?? 0);
    for (const ln of wrap(clean(text), f, size, WIDTH - MARGIN * 2 - (opts.indent ?? 0))) {
      if (y < MARGIN + 24) newPage();
      page.drawText(ln, { x, y, size, font: f, color: opts.color ?? ink });
      y -= size + 4;
    }
    y -= opts.gap ?? 0;
  };

  // Cover
  watermark(page);
  y = HEIGHT - 200;
  page.drawRectangle({ x: MARGIN, y: y - 6, width: 46, height: 46, color: rgb(brand.r, brand.g, brand.b) });
  y -= 70;
  write(input.scope.legal, { size: 13, font: bold, color: rgb(brand.r, brand.g, brand.b) });
  y -= 6;
  write(meta.title, { size: 26, font: bold, color: rgb(brand.r, brand.g, brand.b) });
  write(`${meta.benchmark}  ·  Profile ${input.scope.profile}  ·  ${input.scope.env}`, { size: 11, color: muted, gap: 20 });
  write(`Classification: ${input.scope.classification}`, { size: 11 });
  write(`Document version: ${input.scope.docv}   ·   Date: ${generatedAt}`, { size: 11 });
  write(`Owner: ${input.scope.owner}`, { size: 11, gap: 16 });
  write(`License ID: ${licenseId}`, { size: 9, color: muted });
  write(input.scope.confidentiality || "Confidential. Do not distribute.", { size: 9, color: muted });

  const included = rows.filter((r) => r.status === "included");
  const excluded = rows.filter((r) => r.status === "excluded");

  newPage();
  write("1. Executive summary", { size: 15, font: bold, gap: 8 });
  write(`This baseline adapts the ${meta.benchmark} to ${input.scope.legal}. Of ${rows.length} candidate controls, ${included.length} are included and ${excluded.length} are excluded with recorded justification. ${meta.source}`, { size: 10, color: muted, gap: 16 });

  write("2. Applicability matrix", { size: 15, font: bold, gap: 8 });
  for (const r of rows) {
    write(`${r.id}  ${r.title}`, { size: 10, font: bold });
    write(`${r.status === "included" ? "Included" : "Excluded"}${r.reason ? " — " + r.reason : ""}`, { size: 9, color: muted, indent: 8, gap: 4 });
  }

  newPage();
  write("3. Controls", { size: 15, font: bold, gap: 10 });
  for (const c of included) {
    if (y < MARGIN + 90) newPage();
    write(`${c.id}  ${c.title}`, { size: 12, font: bold, color: rgb(brand.r, brand.g, brand.b) });
    write(`Severity: ${c.severity}  ·  Profile: ${c.profile}  ·  NIST ${c.nist} · CSF ${c.csf} · ISO ${c.iso}`, { size: 8, color: muted, gap: 2 });
    write(`Rationale. ${c.rationale}`, { size: 10 });
    write(`Audit. ${c.audit}`, { size: 10 });
    write(`Remediation. ${c.remediationResolved}`, { size: 10, gap: 12 });
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

// ─────────────────────────── XLSX ───────────────────────────
async function buildXlsx(input: GenInput, rows: ResolvedRow[], meta: DocMeta, licenseId: string, generatedAt: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "HardenHub";

  const cover = wb.addWorksheet("Summary");
  cover.columns = [{ width: 26 }, { width: 70 }];
  const metaRows: [string, string][] = [
    ["Organization", input.scope.legal],
    ["Document", meta.title],
    ["Benchmark", meta.benchmark],
    ["Profile", input.scope.profile],
    ["Environment", input.scope.env],
    ["Classification", input.scope.classification],
    ["Document version", input.scope.docv],
    ["Date", generatedAt],
    ["Owner", input.scope.owner],
    ["Controls included", String(rows.filter((r) => r.status === "included").length)],
    ["Controls excluded", String(rows.filter((r) => r.status === "excluded").length)],
    ["License ID", licenseId],
  ];
  metaRows.forEach(([k, v]) => {
    const row = cover.addRow([k, v]);
    row.getCell(1).font = { bold: true, color: { argb: "FF57534E" } };
  });

  const ws = wb.addWorksheet("Control matrix");
  ws.columns = [
    { header: "ID", key: "id", width: 12 },
    { header: "Title", key: "title", width: 46 },
    { header: "Family", key: "family", width: 22 },
    { header: "Severity", key: "severity", width: 10 },
    { header: "Profile", key: "profile", width: 8 },
    { header: "Status", key: "status", width: 10 },
    { header: "Justification", key: "reason", width: 26 },
    { header: "Rationale", key: "rationale", width: 50 },
    { header: "Audit", key: "audit", width: 40 },
    { header: "Remediation", key: "remediation", width: 60 },
    { header: "NIST 800-53", key: "nist", width: 12 },
    { header: "NIST CSF", key: "csf", width: 10 },
    { header: "ISO 27002", key: "iso", width: 10 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F2EA" } };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  for (const r of rows) {
    ws.addRow({
      id: r.id, title: r.title, family: r.family, severity: r.severity, profile: r.profile,
      status: r.status === "included" ? "Included" : "Excluded", reason: r.reason || "",
      rationale: r.rationale, audit: r.audit, remediation: r.remediationResolved,
      nist: r.nist, csf: r.csf, iso: r.iso,
    });
  }
  ws.autoFilter = { from: "A1", to: "M1" };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf as ArrayBuffer);
}

const EXT: Record<string, string> = { DOCX: "docx", PDF: "pdf", XLSX: "xlsx", POLICY: "policy.docx" };

// Resolve the policy meta + narrative + in-scope controls shared by the built-in generator,
// the customer-template injector and the live preview — one place, one behaviour.
async function resolvePolicy(input: GenInput, rows: ResolvedRow[], meta: DocMeta, platform: string, benchVersion: string, generatedAt: string): Promise<{ policyMeta: PolicyMeta; included: FullControl[]; narrative: Awaited<ReturnType<typeof resolveNarrative>>["narrative"]; aiUsed: boolean }> {
  // Substitute ODP values into remediation text so the standard reflects the customer's parameters.
  const included: FullControl[] = rows.filter((r) => r.status === "included").map((r) => ({ ...r, remediation: r.remediationResolved }));
  const sectionTitles = [...new Set(included.map((c) => c.family).filter(Boolean))];
  const { narrative, aiUsed } = await resolveNarrative({
    org: input.scope.legal,
    platform: platform || "the in-scope technology",
    benchTitle: meta.benchmark,
    benchVersion: benchVersion || "",
    controlCount: included.length,
    sectionTitles,
  });
  const policyMeta: PolicyMeta = {
    org: input.scope.legal,
    title: `${(meta.title || "Security").replace(/ — Security Baseline$/, "")} Hardening Standard`,
    version: input.scope.docv,
    author: input.scope.owner,
    date: generatedAt,
    color: input.scope.color,
    classification: input.scope.classification,
    platform: platform || "",
    benchTitle: meta.benchmark,
    benchVersion: benchVersion || "",
  };
  return { policyMeta, included, narrative, aiUsed };
}

// Structured live preview of the policy standard (no file rendered) for the "Generate standard" UI.
export async function policyPreview(input: GenInput): Promise<{ blocks: Block[]; meta: PolicyMeta; aiUsed: boolean; templated: null | "docx" | "pdf" }> {
  const generatedAt = new Date().toISOString().slice(0, 10);
  const { rows, meta, platform, benchVersion } = await resolveRows(input);
  const { policyMeta, included, narrative, aiUsed } = await resolvePolicy(input, rows, meta, platform, benchVersion, generatedAt);
  const blocks = policyBlocks(policyMeta, included, narrative);
  return { blocks, meta: policyMeta, aiUsed, templated: input.template?.type ?? null };
}

// Build the editable policy/standard document (ported from the /cis policy engine).
// When the customer supplied a house-style template, the deliverable is rendered inside it
// (DOCX preferred, PDF supported) so the output carries their cover, headers/footers and brand.
async function buildPolicy(input: GenInput, rows: ResolvedRow[], meta: DocMeta, platform: string, benchVersion: string, generatedAt: string): Promise<{ buffer: Buffer; ext: string; aiUsed: boolean }> {
  const { policyMeta, included, narrative, aiUsed } = await resolvePolicy(input, rows, meta, platform, benchVersion, generatedAt);

  if (input.template?.base64) {
    const tpl = Buffer.from(input.template.base64, "base64");
    if (input.template.type === "pdf") {
      const buffer = await injectPolicyIntoPdf(tpl, policyMeta, included, narrative);
      return { buffer, ext: "policy.pdf", aiUsed };
    }
    const buffer = await injectPolicyIntoDocx(tpl, policyMeta, included, narrative);
    return { buffer, ext: "policy.docx", aiUsed };
  }

  const buffer = await buildPolicyDocx(policyMeta, included, narrative);
  return { buffer, ext: "policy.docx", aiUsed };
}

// Orchestrate generation for all requested formats; persist artifacts + return metadata (FR-G-03).
export async function generateArtifacts(input: GenInput, jobId: string): Promise<ArtifactMeta[]> {
  const { rows, meta, platform, benchVersion } = await resolveRows(input);
  const licenseId = "HH-LIC-" + crypto.createHash("sha1").update(jobId).digest("hex").slice(0, 8).toUpperCase();
  const generatedAt = new Date().toISOString().slice(0, 10);
  await fs.mkdir(STORAGE, { recursive: true });

  const builders: Record<string, () => Promise<{ buffer: Buffer; ext: string }>> = {
    DOCX: async () => ({ buffer: await buildDocx(input, rows, meta, licenseId, generatedAt), ext: EXT.DOCX }),
    PDF: async () => ({ buffer: await buildPdf(input, rows, meta, licenseId, generatedAt), ext: EXT.PDF }),
    XLSX: async () => ({ buffer: await buildXlsx(input, rows, meta, licenseId, generatedAt), ext: EXT.XLSX }),
    POLICY: async () => { const r = await buildPolicy(input, rows, meta, platform, benchVersion, generatedAt); return { buffer: r.buffer, ext: r.ext }; },
  };

  const out: ArtifactMeta[] = [];
  for (const fmt of input.formats) {
    const build = builders[fmt];
    if (!build) continue;
    const { buffer, ext } = await build();
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    const fileName = `${jobId}.${ext}`;
    await fs.writeFile(path.join(STORAGE, fileName), buffer);
    out.push({ format: fmt, fileName, url: `/api/artifact/${fileName}`, hash, bytes: buffer.length, licenseId });
  }
  return out;
}
