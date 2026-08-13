// Render a stored AI-drafted Standard to DOCX or PDF from its saved narrative.
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Narrative } from "./policyNarrative";
import type { Block } from "./policyContent";

// A real requirement group extracted/derived from the source document: a heading, an
// optional short intro, and enforceable "shall" requirement statements grounded in the source.
export type ReqSection = { heading: string; intro?: string; requirements: string[] };
export type StandardContent = {
  narrative: Narrative;
  sections: string[]; // legacy: scraped headings (kept for back-compat)
  requirementSections?: ReqSection[]; // preferred: real requirements from the source
  summary?: string;
  references?: string[];
  sourceUrl?: string;
  platform?: string;
};

export function parseContent(json: string): StandardContent {
  try { return JSON.parse(json) as StandardContent; } catch { return { narrative: {} as Narrative, sections: [] }; }
}

// True when the standard carries real, source-derived requirements (not just headings).
function hasReqSections(c: StandardContent): boolean {
  return Array.isArray(c.requirementSections) && c.requirementSections.some((s) => s && s.requirements && s.requirements.length > 0);
}

// When a buyer generates a purchased standard, their company name personalises the document.
export type StandardScope = { org?: string; version?: string; classification?: string; date?: string };

// Block model of a stored standard, so a buyer's house-style template can be filled the same
// way the hardening policy is (see policyTemplate.injectBlocksIntoDocx/Pdf).
export function standardBlocks(title: string, c: StandardContent, scope: StandardScope = {}): Block[] {
  const n = c.narrative;
  const b: Block[] = [];
  if (scope.org) b.push({ t: "p", text: `Prepared for ${scope.org}.` });
  b.push({ t: "h1", text: "1. Purpose" });
  if (n.purposeIntro) b.push({ t: "p", text: n.purposeIntro });
  (n.purposeAims || []).forEach((x) => b.push({ t: "li", text: x }));
  b.push({ t: "h1", text: "2. Scope" });
  if (n.scopeIntro) b.push({ t: "p", text: scope.org ? n.scopeIntro.replace(/\bthe organization\b/gi, scope.org) : n.scopeIntro });
  (n.scopeCovers || []).forEach((x) => b.push({ t: "li", text: x }));
  b.push({ t: "h1", text: "3. Roles & responsibilities" });
  (n.roles || []).forEach((r) => b.push({ t: "role", role: r.role, resp: r.responsibilities || [] }));

  b.push({ t: "h1", text: "4. Security requirements" });
  if (hasReqSections(c)) {
    c.requirementSections!.forEach((sec) => {
      if (!sec || !sec.requirements?.length) return;
      b.push({ t: "h2", text: sec.heading || "Requirements" });
      if (sec.intro) b.push({ t: "p", text: sec.intro });
      sec.requirements.forEach((r) => b.push({ t: "li", text: r }));
    });
  } else {
    (c.sections || []).forEach((s) => b.push({ t: "li", text: s }));
  }

  b.push({ t: "h1", text: "5. Compliance" });
  if (n.complianceIntro) b.push({ t: "p", text: n.complianceIntro });
  if (n.complianceEnforcement) b.push({ t: "p", text: n.complianceEnforcement });

  if (c.references && c.references.length) {
    b.push({ t: "h1", text: "6. References" });
    c.references.forEach((r) => b.push({ t: "li", text: r }));
  }
  return b;
}

// Inline {{PLACEHOLDER}} values for a buyer's DOCX template.
export function standardInlineMap(title: string, scope: StandardScope): Record<string, string> {
  return {
    "{{TITLE}}": title,
    "{{ORG}}": scope.org || "",
    "{{VERSION}}": scope.version || "1.0",
    "{{DATE}}": scope.date || new Date().toISOString().slice(0, 10),
    "{{CLASSIFICATION}}": scope.classification || "Internal Use",
  };
}

export async function buildStandardDocx(title: string, c: StandardContent, scope: StandardScope = {}): Promise<Buffer> {
  const n = c.narrative;
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
        ...(scope.org ? [new Paragraph({ children: [new TextRun({ text: `Prepared for ${scope.org}`, bold: true, size: 22 })] })] : []),
        ...(c.sourceUrl ? [new Paragraph({ children: [new TextRun({ text: `Source: ${c.sourceUrl}`, italics: true, size: 18, color: "6b6b6b" })] })] : []),
        new Paragraph({ text: "1. Purpose", heading: HeadingLevel.HEADING_1 }),
        new Paragraph(n.purposeIntro || ""),
        ...(n.purposeAims || []).map((a) => new Paragraph({ text: a, bullet: { level: 0 } })),
        new Paragraph({ text: "2. Scope", heading: HeadingLevel.HEADING_1 }),
        new Paragraph(n.scopeIntro || ""),
        ...(n.scopeCovers || []).map((a) => new Paragraph({ text: a, bullet: { level: 0 } })),
        new Paragraph({ text: "3. Roles & responsibilities", heading: HeadingLevel.HEADING_1 }),
        ...(n.roles || []).flatMap((r) => [new Paragraph({ children: [new TextRun({ text: r.role, bold: true })] }), ...(r.responsibilities || []).map((x) => new Paragraph({ text: x, bullet: { level: 0 } }))]),
        new Paragraph({ text: "4. Security requirements", heading: HeadingLevel.HEADING_1 }),
        ...(hasReqSections(c)
          ? c.requirementSections!.filter((s) => s && s.requirements?.length).flatMap((sec) => [
              new Paragraph({ text: sec.heading || "Requirements", heading: HeadingLevel.HEADING_2 }),
              ...(sec.intro ? [new Paragraph(sec.intro)] : []),
              ...sec.requirements.map((r) => new Paragraph({ text: r, bullet: { level: 0 } })),
            ])
          : (c.sections || []).map((s) => new Paragraph({ text: s, bullet: { level: 0 } }))),
        new Paragraph({ text: "5. Compliance", heading: HeadingLevel.HEADING_1 }),
        new Paragraph(n.complianceIntro || ""),
        new Paragraph(n.complianceEnforcement || ""),
        ...(c.references && c.references.length
          ? [new Paragraph({ text: "6. References", heading: HeadingLevel.HEADING_1 }), ...c.references.map((r) => new Paragraph({ text: r, bullet: { level: 0 } }))]
          : []),
      ],
    }],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}

function ascii(s: string): string {
  return (s || "").replace(/[—–]/g, "-").replace(/[“”]/g, '"').replace(/[’]/g, "'").replace(/[^\x20-\x7E]/g, "");
}

export async function buildStandardPdf(title: string, c: StandardContent, scope: StandardScope = {}): Promise<Buffer> {
  const n = c.narrative;
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const brand = rgb(0.06, 0.3, 0.61), ink = rgb(0.11, 0.1, 0.09), muted = rgb(0.4, 0.39, 0.37);
  const M = 54, W = 595, H = 842;
  let page = pdf.addPage([W, H]);
  let y = H - 60;
  const nl = (h: number) => { y -= h; if (y < 60) { page = pdf.addPage([W, H]); y = H - 60; } };
  const wrap = (text: string, size: number, f = font, color = ink, indent = 0) => {
    const maxW = W - 2 * M - indent, words = ascii(text).split(/\s+/); let line = "";
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (f.widthOfTextAtSize(t, size) > maxW) { page.drawText(line, { x: M + indent, y, size, font: f, color }); nl(size + 4); line = w; }
      else line = t;
    }
    if (line) { page.drawText(line, { x: M + indent, y, size, font: f, color }); nl(size + 6); }
  };
  page.drawText(ascii(title), { x: M, y, size: 20, font: bold, color: brand }); nl(28);
  if (scope.org) { wrap(`Prepared for ${scope.org}`, 11, bold, ink); nl(4); }
  if (c.sourceUrl) { wrap(`Source: ${c.sourceUrl}`, 9, font, muted); nl(6); }
  const heading = (t: string) => { nl(8); page.drawText(ascii(t), { x: M, y, size: 13, font: bold, color: ink }); nl(20); };
  const subheading = (t: string) => { nl(4); wrap(t, 11.5, bold, brand); };
  const bullets = (arr: string[]) => (arr || []).forEach((a) => wrap("- " + a, 10.5, font, ink, 6));
  heading("1. Purpose"); wrap(n.purposeIntro || "", 10.5); bullets(n.purposeAims || []);
  heading("2. Scope"); wrap(n.scopeIntro || "", 10.5); bullets(n.scopeCovers || []);
  heading("3. Roles & responsibilities");
  (n.roles || []).forEach((r) => { wrap(r.role, 11, bold); bullets(r.responsibilities || []); });
  heading("4. Security requirements");
  if (hasReqSections(c)) {
    c.requirementSections!.filter((sec) => sec && sec.requirements?.length).forEach((sec) => {
      subheading(sec.heading || "Requirements");
      if (sec.intro) wrap(sec.intro, 10.5, font, muted);
      bullets(sec.requirements);
    });
  } else {
    bullets(c.sections || []);
  }
  heading("5. Compliance"); wrap(n.complianceIntro || "", 10.5); wrap(n.complianceEnforcement || "", 10.5);
  if (c.references && c.references.length) { heading("6. References"); bullets(c.references); }
  return Buffer.from(await pdf.save());
}
