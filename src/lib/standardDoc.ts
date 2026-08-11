// Render a stored AI-drafted Standard to DOCX or PDF from its saved narrative.
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Narrative } from "./policyNarrative";

export type StandardContent = { narrative: Narrative; sections: string[]; sourceUrl?: string; platform?: string };

export function parseContent(json: string): StandardContent {
  try { return JSON.parse(json) as StandardContent; } catch { return { narrative: {} as Narrative, sections: [] }; }
}

export async function buildStandardDocx(title: string, c: StandardContent): Promise<Buffer> {
  const n = c.narrative;
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
        ...(c.sourceUrl ? [new Paragraph({ children: [new TextRun({ text: `Source: ${c.sourceUrl}`, italics: true, size: 18, color: "6b6b6b" })] })] : []),
        new Paragraph({ text: "1. Purpose", heading: HeadingLevel.HEADING_1 }),
        new Paragraph(n.purposeIntro || ""),
        ...(n.purposeAims || []).map((a) => new Paragraph({ text: a, bullet: { level: 0 } })),
        new Paragraph({ text: "2. Scope", heading: HeadingLevel.HEADING_1 }),
        new Paragraph(n.scopeIntro || ""),
        ...(n.scopeCovers || []).map((a) => new Paragraph({ text: a, bullet: { level: 0 } })),
        new Paragraph({ text: "3. Roles & responsibilities", heading: HeadingLevel.HEADING_1 }),
        ...(n.roles || []).flatMap((r) => [new Paragraph({ children: [new TextRun({ text: r.role, bold: true })] }), ...(r.responsibilities || []).map((x) => new Paragraph({ text: x, bullet: { level: 0 } }))]),
        ...(c.sections && c.sections.length ? [new Paragraph({ text: "4. Requirements (from source)", heading: HeadingLevel.HEADING_1 }), ...c.sections.map((s) => new Paragraph({ text: s, bullet: { level: 0 } }))] : []),
        new Paragraph({ text: "5. Compliance", heading: HeadingLevel.HEADING_1 }),
        new Paragraph(n.complianceIntro || ""),
        new Paragraph(n.complianceEnforcement || ""),
      ],
    }],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}

function ascii(s: string): string {
  return (s || "").replace(/[—–]/g, "-").replace(/[“”]/g, '"').replace(/[’]/g, "'").replace(/[^\x20-\x7E]/g, "");
}

export async function buildStandardPdf(title: string, c: StandardContent): Promise<Buffer> {
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
  if (c.sourceUrl) { wrap(`Source: ${c.sourceUrl}`, 9, font, muted); nl(6); }
  const heading = (t: string) => { nl(8); page.drawText(ascii(t), { x: M, y, size: 13, font: bold, color: ink }); nl(20); };
  const bullets = (arr: string[]) => (arr || []).forEach((a) => wrap("• " + a, 10.5, font, ink, 6));
  heading("1. Purpose"); wrap(n.purposeIntro || "", 10.5); bullets(n.purposeAims || []);
  heading("2. Scope"); wrap(n.scopeIntro || "", 10.5); bullets(n.scopeCovers || []);
  heading("3. Roles & responsibilities");
  (n.roles || []).forEach((r) => { wrap(r.role, 11, bold); bullets(r.responsibilities || []); });
  if (c.sections && c.sections.length) { heading("4. Requirements (from source)"); bullets(c.sections); }
  heading("5. Compliance"); wrap(n.complianceIntro || "", 10.5); wrap(n.complianceEnforcement || "", 10.5);
  return Buffer.from(await pdf.save());
}
