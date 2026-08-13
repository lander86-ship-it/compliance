// Built-in policy-document generator (neutral template) on the `docx` library.
// Renders the shared policy block model into an editable corporate security standard.

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType,
} from "docx";
import type { FullControl } from "./hub/controlContent";
import type { Narrative } from "./policyNarrative";
import { policyBlocks, type PolicyMeta, type Block } from "./policyContent";

export type { PolicyMeta } from "./policyContent";

const HEAD = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3 } as const;

export async function buildPolicyDocx(meta: PolicyMeta, controls: FullControl[], narrative: Narrative): Promise<Buffer> {
  return buildBlocksDocx(meta, policyBlocks(meta, controls, narrative));
}

// The SecureHub house style (cover + version-history table + branded headings), rendering an
// arbitrary Block[] — shared by the hardening policy and the standalone standards so both
// carry the same default branding.
export async function buildBlocksDocx(meta: PolicyMeta, blocks: Block[]): Promise<Buffer> {
  const brand = meta.color.replace("#", "");

  const children: (Paragraph | Table)[] = [];

  // Cover / title block
  children.push(new Paragraph({ spacing: { before: 800 }, children: [new TextRun({ text: meta.org, bold: true, size: 28, color: brand })] }));
  children.push(new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: meta.title, bold: true, size: 52, color: brand })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: `Operationalises: ${meta.benchTitle}${meta.benchVersion ? ` (${meta.benchVersion})` : ""}`, size: 22, color: "57534E" })] }));
  children.push(new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: `Classification: ${meta.classification}   ·   Version: ${meta.version}   ·   Date: ${meta.date}`, size: 20 })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: `Owner: ${meta.author}`, size: 20 })] }));

  const vb = { style: BorderStyle.SINGLE, size: 1, color: "E7E6E5" };
  children.push(new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Version history" })] }));
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: vb, bottom: vb, left: vb, right: vb, insideHorizontal: vb, insideVertical: vb },
      rows: [
        new TableRow({ tableHeader: true, children: ["Version", "Date", "Author", "Description"].map((t) => new TableCell({ shading: { type: ShadingType.CLEAR, color: "auto", fill: brand }, children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: "FFFFFF", size: 18 })] })] })) }),
        new TableRow({ children: [meta.version, meta.date, meta.author, "Initial issue"].map((t) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t, size: 18 })] })] })) }),
      ],
    }),
  );

  let firstH1 = true;
  for (const bl of blocks) {
    switch (bl.t) {
      case "h1":
        children.push(new Paragraph({ heading: HEAD[1], pageBreakBefore: firstH1, spacing: { before: 240, after: 80 }, children: [new TextRun({ text: bl.text })] }));
        firstH1 = false;
        break;
      case "h2":
        children.push(new Paragraph({ heading: HEAD[2], spacing: { before: 160, after: 40 }, children: [new TextRun({ text: bl.text })] }));
        break;
      case "h3":
        children.push(new Paragraph({ heading: HEAD[3], spacing: { before: 100, after: 20 }, children: [new TextRun({ text: bl.text, color: brand })] }));
        break;
      case "p":
        children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: bl.text, size: 20 })] }));
        break;
      case "li":
        children.push(new Paragraph({ text: bl.text, bullet: { level: 0 }, spacing: { after: 40 } }));
        break;
      case "kv":
        children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${bl.label}. `, bold: true, size: 18 }), new TextRun({ text: bl.text, size: 18 })] }));
        break;
      case "role":
        children.push(new Paragraph({ spacing: { before: 60, after: 20 }, children: [new TextRun({ text: bl.role, bold: true, size: 19 })] }));
        bl.resp.forEach((r) => children.push(new Paragraph({ text: r, bullet: { level: 0 }, spacing: { after: 20 } })));
        break;
    }
  }

  const doc = new Document({
    creator: "SecureHub",
    title: meta.title,
    description: `${meta.org} — ${meta.benchTitle}`,
    styles: { default: { document: { run: { font: "Calibri" } } } },
    sections: [{ properties: {}, children }],
  });
  return Packer.toBuffer(doc);
}
