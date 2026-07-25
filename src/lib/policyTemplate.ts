// Customer-template injector. Lets a client upload their own house-style DOCX (preferred)
// or PDF, and delivers the generated security standard *inside that template* so the output
// carries the customer's cover, headers/footers, fonts and branding.
//
// DOCX  — unzip, heal Word's run-splitting, replace inline {{PLACEHOLDERS}}, and swap the
//         {{POLICY_BODY}} marker paragraph for OOXML serialized from the shared block model
//         (src/lib/policyContent.ts) so built-in and templated output stay identical in content.
// PDF   — use the uploaded PDF's pages as a branded cover/prefix, then append the generated
//         policy content as new pages (pdf-lib can't reflow arbitrary vector layouts).

import JSZip from "jszip";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { FullControl } from "./hub/controlContent";
import type { Narrative } from "./policyNarrative";
import { policyBlocks, type PolicyMeta, type Block } from "./policyContent";

export const TEMPLATE_PLACEHOLDERS = [
  "{{POLICY_BODY}}", "{{ORG}}", "{{TITLE}}", "{{VERSION}}", "{{DATE}}",
  "{{CLASSIFICATION}}", "{{AUTHOR}}", "{{BENCHMARK}}", "{{PLATFORM}}",
] as const;

function inlineMap(meta: PolicyMeta): Record<string, string> {
  return {
    "{{ORG}}": meta.org,
    "{{TITLE}}": meta.title,
    "{{VERSION}}": meta.version,
    "{{DATE}}": meta.date,
    "{{CLASSIFICATION}}": meta.classification,
    "{{AUTHOR}}": meta.author,
    "{{PLATFORM}}": meta.platform || "",
    "{{BENCHMARK}}": `${meta.benchTitle}${meta.benchVersion ? ` (${meta.benchVersion})` : ""}`,
  };
}

// ─────────────────────────── OOXML helpers ───────────────────────────
function xmlEsc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// A run with optional bold + brand colour. xml:space=preserve keeps leading/trailing spaces.
function run(text: string, opts: { bold?: boolean; color?: string; size?: number } = {}): string {
  const rpr: string[] = [];
  if (opts.bold) rpr.push("<w:b/>");
  if (opts.color) rpr.push(`<w:color w:val="${opts.color}"/>`);
  if (opts.size) rpr.push(`<w:sz w:val="${opts.size}"/>`);
  const rprXml = rpr.length ? `<w:rPr>${rpr.join("")}</w:rPr>` : "";
  return `<w:r>${rprXml}<w:t xml:space="preserve">${xmlEsc(text)}</w:t></w:r>`;
}

function para(runs: string, opts: { style?: string; bullet?: boolean } = {}): string {
  const ppr: string[] = [];
  if (opts.style) ppr.push(`<w:pStyle w:val="${opts.style}"/>`);
  const pprXml = ppr.length ? `<w:pPr>${ppr.join("")}</w:pPr>` : "";
  return `<w:p>${pprXml}${runs}</w:p>`;
}

// Serialize the shared block model into OOXML paragraphs, reusing the template's own
// Heading1/2/3 styles. Lists render as bullet-prefixed body paragraphs (numbering-def free,
// so the output works against any uploaded template without touching numbering.xml).
function blocksToOoxml(blocks: Block[], brand: string): string {
  const out: string[] = [];
  for (const bl of blocks) {
    switch (bl.t) {
      case "h1": out.push(para(run(bl.text), { style: "Heading1" })); break;
      case "h2": out.push(para(run(bl.text), { style: "Heading2" })); break;
      case "h3": out.push(para(run(bl.text, { color: brand }), { style: "Heading3" })); break;
      case "p": out.push(para(run(bl.text))); break;
      case "li": out.push(para(run(`•\t${bl.text}`))); break;
      case "kv": out.push(para(`${run(`${bl.label}. `, { bold: true })}${run(bl.text)}`)); break;
      case "role":
        out.push(para(run(bl.role, { bold: true, color: brand })));
        bl.resp.forEach((r) => out.push(para(run(`•\t${r}`))));
        break;
    }
  }
  return out.join("");
}

// ─────────────────────────── DOCX healing ───────────────────────────
// Word fragments a typed token across runs (spell-check proofing, format ticks). Strip proof
// markers and merge adjacent runs sharing identical <w:rPr> so placeholders sit in one <w:t>.
function healRuns(xml: string): string {
  let s = xml.replace(/<w:proofErr[^>]*\/>/g, "").replace(/<w:noProof\s*\/>/g, "");
  // Merge runs where run A's rPr equals run B's rPr and both carry simple text.
  const runRe = /<w:r>(<w:rPr>.*?<\/w:rPr>)?(<w:t(?: [^>]*)?>)(.*?)<\/w:t><\/w:r>/gs;
  type R = { rpr: string; text: string };
  // Two passes are enough to collapse the common 2–3 way splits Word produces.
  for (let pass = 0; pass < 3; pass++) {
    const parsed: { raw: string; r: R }[] = [];
    let m: RegExpExecArray | null;
    runRe.lastIndex = 0;
    while ((m = runRe.exec(s))) parsed.push({ raw: m[0], r: { rpr: m[1] || "", text: m[3] } });
    if (parsed.length < 2) break;
    let changed = false;
    // Rebuild the string, merging neighbouring identical-rPr runs that are directly adjacent.
    let result = "";
    let idx = 0;
    while (idx < s.length) {
      runRe.lastIndex = idx;
      const a = runRe.exec(s);
      if (!a || a.index !== idx) { result += s[idx]; idx++; continue; }
      // a is a run starting exactly at idx. Look for an immediately-following run.
      let mergedText = a[3];
      const rpr = a[1] || "";
      let end = a.index + a[0].length;
      runRe.lastIndex = end;
      let b = runRe.exec(s);
      while (b && b.index === end && (b[1] || "") === rpr) {
        mergedText += b[3];
        end = b.index + b[0].length;
        changed = true;
        runRe.lastIndex = end;
        b = runRe.exec(s);
      }
      result += `<w:r>${rpr}<w:t xml:space="preserve">${mergedText}</w:t></w:r>`;
      idx = end;
    }
    s = result;
    if (!changed) break;
  }
  return s;
}

// Replace the whole <w:p> paragraph that contains {{POLICY_BODY}} with the serialized policy.
function replaceBodyMarker(xml: string, bodyOoxml: string): { xml: string; found: boolean } {
  const paraRe = /<w:p\b[^>]*>(?:(?!<\/w:p>)[\s\S])*?<\/w:p>/g;
  let found = false;
  const replaced = xml.replace(paraRe, (p) => {
    if (!found && p.includes("{{POLICY_BODY}}")) { found = true; return bodyOoxml; }
    return p;
  });
  return { xml: replaced, found };
}

export async function injectPolicyIntoDocx(
  templateBuffer: Buffer, meta: PolicyMeta, controls: FullControl[], narrative: Narrative,
): Promise<Buffer> {
  const zip = await JSZip.loadAsync(templateBuffer);
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw new Error("Uploaded file is not a valid .docx (missing word/document.xml).");

  let xml = await docFile.async("string");
  xml = healRuns(xml);

  // Inline placeholders (order-independent, literal replace).
  const brand = meta.color.replace("#", "");
  const inline = inlineMap(meta);
  for (const [k, v] of Object.entries(inline)) xml = xml.split(k).join(xmlEsc(v));

  // Body: swap the marker paragraph for the generated content.
  const blocks = policyBlocks(meta, controls, narrative);
  const bodyOoxml = blocksToOoxml(blocks, brand);
  const res = replaceBodyMarker(xml, bodyOoxml);
  if (res.found) {
    xml = res.xml;
  } else {
    // No marker present: append the policy body before the final sectPr so it still renders.
    const sectRe = /(<w:sectPr\b[\s\S]*?<\/w:sectPr>)\s*<\/w:body>/;
    xml = sectRe.test(xml)
      ? xml.replace(sectRe, `${bodyOoxml}$1</w:body>`)
      : xml.replace(/<\/w:body>/, `${bodyOoxml}</w:body>`);
  }

  zip.file("word/document.xml", xml);
  const out = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return out;
}

// ─────────────────────────── PDF cover-prefix ───────────────────────────
export async function injectPolicyIntoPdf(
  templateBuffer: Buffer, meta: PolicyMeta, controls: FullControl[], narrative: Narrative,
): Promise<Buffer> {
  const out = await PDFDocument.create();

  // 1) Copy the uploaded template's pages verbatim as a branded cover/prefix.
  try {
    const tpl = await PDFDocument.load(templateBuffer);
    const pages = await out.copyPages(tpl, tpl.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  } catch {
    throw new Error("Uploaded file is not a valid PDF template.");
  }

  // 2) Append the generated policy content as fresh pages.
  const font = await out.embedFont(StandardFonts.Helvetica);
  const bold = await out.embedFont(StandardFonts.HelveticaBold);
  const brand = hexToRgb(meta.color);
  const ink = rgb(0.11, 0.1, 0.09);
  const muted = rgb(0.34, 0.33, 0.31);
  const M = 56, W = 595.28, H = 841.89;
  let page = out.addPage([W, H]);
  let y = H - M;

  const clean = (t: string) =>
    t.replace(/[→⇒]/g, "->").replace(/[—–]/g, "-").replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'").replace(/…/g, "...").replace(/[••]/g, "-").replace(/[^\x00-\xFF]/g, "");
  const wrap = (t: string, f: PDFFont, size: number, maxW: number): string[] => {
    const words = clean(t).split(/\s+/); const lines: string[] = []; let line = "";
    for (const w of words) { const test = line ? `${line} ${w}` : w; if (f.widthOfTextAtSize(test, size) > maxW && line) { lines.push(line); line = w; } else line = test; }
    if (line) lines.push(line); return lines;
  };
  const write = (t: string, o: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; gap?: number; indent?: number } = {}) => {
    const size = o.size ?? 10, f = o.font ?? font, x = M + (o.indent ?? 0);
    for (const ln of wrap(t, f, size, W - M * 2 - (o.indent ?? 0))) {
      if (y < M + 24) { page = out.addPage([W, H]); y = H - M; }
      page.drawText(ln, { x, y, size, font: f, color: o.color ?? ink }); y -= size + 4;
    }
    y -= o.gap ?? 0;
  };

  for (const bl of policyBlocks(meta, controls, narrative)) {
    switch (bl.t) {
      case "h1": if (y < M + 60) { page = out.addPage([W, H]); y = H - M; } write(bl.text, { size: 15, font: bold, color: rgb(brand.r, brand.g, brand.b), gap: 8 }); break;
      case "h2": write(bl.text, { size: 12, font: bold, gap: 4 }); break;
      case "h3": write(bl.text, { size: 11, font: bold, color: rgb(brand.r, brand.g, brand.b), gap: 2 }); break;
      case "p": write(bl.text, { size: 10, color: muted, gap: 6 }); break;
      case "li": write(`-  ${bl.text}`, { size: 10, indent: 8, gap: 2 }); break;
      case "kv": write(`${bl.label}. ${bl.text}`, { size: 10, indent: 8, gap: 2 }); break;
      case "role": write(bl.role, { size: 11, font: bold, gap: 2 }); bl.resp.forEach((r) => write(`-  ${r}`, { size: 10, indent: 8, gap: 2 })); break;
    }
  }

  const bytes = await out.save();
  return Buffer.from(bytes);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}
