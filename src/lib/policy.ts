// Policy-document generator — ported (structure) from the /cis service's app/policy.py,
// rebuilt in TypeScript on the `docx` library with a NEUTRAL, client-agnostic template
// (no third-party house style). Turns a benchmark's controls into an editable corporate
// security standard: Purpose · Scope · Roles · Security Requirements · Compliance · References.

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, AlignmentType,
} from "docx";
import type { FullControl } from "./hub/controlContent";
import type { Narrative } from "./policyNarrative";

export type PolicyMeta = {
  org: string;
  title: string;
  version: string;
  author: string;
  date: string;
  color: string; // brand hex, e.g. #0f4c9c
  classification: string;
  platform: string;
  benchTitle: string;
  benchVersion: string;
};

type Section = { title: string; controls: FullControl[] };

function groupBySection(controls: FullControl[]): Section[] {
  const order: string[] = [];
  const map = new Map<string, FullControl[]>();
  for (const c of controls) {
    const fam = c.family || "General";
    if (!map.has(fam)) { map.set(fam, []); order.push(fam); }
    map.get(fam)!.push(c);
  }
  return order.map((t) => ({ title: t, controls: map.get(t)! }));
}

const bullet = (text: string) => new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 40 } });
const body = (text: string) => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, size: 20 })] });
const h1 = (text: string) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 80 }, children: [new TextRun({ text })] });
const h2 = (text: string) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 160, after: 40 }, children: [new TextRun({ text })] });
const h3 = (text: string) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 100, after: 20 }, children: [new TextRun({ text })] });
const labelP = (label: string, value: string) =>
  new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${label}. `, bold: true, size: 18 }), new TextRun({ text: value, size: 18 })] });

function rolesTable(narrative: Narrative, brand: string): Table {
  const headCell = (t: string) =>
    new TableCell({ shading: { type: ShadingType.CLEAR, color: "auto", fill: brand }, children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: "FFFFFF", size: 18 })] })] });
  const cell = (children: Paragraph[]) => new TableCell({ children });
  const rows = [
    new TableRow({ tableHeader: true, children: [headCell("Role"), headCell("Responsibilities")] }),
    ...narrative.roles.map((r) =>
      new TableRow({
        children: [
          cell([new Paragraph({ children: [new TextRun({ text: r.role, bold: true, size: 18 })] })]),
          cell(r.responsibilities.map((x) => new Paragraph({ text: x, bullet: { level: 0 }, spacing: { after: 20 } }))),
        ],
      }),
    ),
  ];
  const b = { style: BorderStyle.SINGLE, size: 1, color: "E7E6E5" };
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b }, rows });
}

export async function buildPolicyDocx(meta: PolicyMeta, controls: FullControl[], narrative: Narrative): Promise<Buffer> {
  const brand = meta.color.replace("#", "");
  const sections = groupBySection(controls);
  const titledSections = sections.filter((s) => s.title.trim()).length;

  const children: Paragraph[] = [];

  // Cover / title block
  children.push(new Paragraph({ spacing: { before: 800 }, children: [new TextRun({ text: meta.org, bold: true, size: 28, color: brand })] }));
  children.push(new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: meta.title, bold: true, size: 52, color: brand })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: `Operationalises: ${meta.benchTitle}${meta.benchVersion ? ` (${meta.benchVersion})` : ""}`, size: 22, color: "57534E" })] }));
  children.push(new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: `Classification: ${meta.classification}   ·   Version: ${meta.version}   ·   Date: ${meta.date}`, size: 20 })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: `Owner: ${meta.author}`, size: 20 })] }));

  // Version history
  children.push(new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Version history" })] }));
  const vb = { style: BorderStyle.SINGLE, size: 1, color: "E7E6E5" };
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: vb, bottom: vb, left: vb, right: vb, insideHorizontal: vb, insideVertical: vb },
      rows: [
        new TableRow({ tableHeader: true, children: ["Version", "Date", "Author", "Description"].map((t) => new TableCell({ shading: { type: ShadingType.CLEAR, color: "auto", fill: brand }, children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: "FFFFFF", size: 18 })] })] })) }),
        new TableRow({ children: [meta.version, meta.date, meta.author, "Initial issue"].map((t) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t, size: 18 })] })] })) }),
      ],
    }) as unknown as Paragraph,
  );

  // 1. Purpose
  children.push(h1("1. Purpose"));
  children.push(body(narrative.purposeIntro));
  children.push(body("This standard ensures that in-scope systems are:"));
  narrative.purposePoints.forEach((x) => children.push(bullet(x)));
  children.push(body("Additionally, this standard aims to:"));
  narrative.purposeAims.forEach((x) => children.push(bullet(x)));

  // 2. Scope
  children.push(h1("2. Scope"));
  children.push(body(narrative.scopeIntro));
  children.push(body("This standard applies to:"));
  narrative.scopeAppliesTo.forEach((x) => children.push(bullet(x)));
  children.push(body("This standard covers:"));
  narrative.scopeCovers.forEach((x) => children.push(bullet(x)));

  // 3. Roles & Responsibilities
  children.push(h1("3. Roles & Responsibilities"));
  children.push(body("The following roles are responsible for the definition, implementation and assurance of this standard."));
  children.push(rolesTable(narrative, brand) as unknown as Paragraph);

  // 4. Security Requirements (controls verbatim)
  children.push(h1("4. Security Requirements"));
  children.push(
    body(
      `This section defines the mandatory security controls for ${meta.platform || "in-scope systems"}, derived from the ` +
        `${meta.benchTitle}${meta.benchVersion ? ` (${meta.benchVersion})` : ""}. It contains ${controls.length} control(s)` +
        `${titledSections ? ` across ${titledSections} section(s)` : ""}. Each control lists its assurance level, rationale, ` +
        `the audit procedure used to verify it, and the remediation required to meet it. All controls are mandatory unless a ` +
        `formal exception has been approved (see Compliance & Exceptions).`,
    ),
  );
  for (const sec of sections) {
    if (sec.title.trim()) children.push(h2(sec.title));
    for (const c of sec.controls) {
      const lvl = c.profile ? ` (${c.profile})` : "";
      children.push(h3(`${c.id} ${c.title}${lvl}`.trim()));
      if (c.nist && c.nist !== "—") children.push(labelP("Maps to NIST 800-53", c.nist));
      if (c.rationale) children.push(labelP("Rationale", c.rationale));
      if (c.audit) children.push(labelP("Audit", c.audit));
      if (c.remediation) children.push(labelP("Remediation", c.remediation));
    }
  }

  // 5. Compliance & Exceptions
  children.push(h1("5. Compliance & Exceptions"));
  children.push(body(narrative.complianceIntro));
  children.push(body("Where a control cannot be technically or operationally met, a formal exception must be requested and risk-assessed before deployment. Each exception shall record:"));
  narrative.complianceExceptionFields.forEach((x) => children.push(bullet(x)));
  children.push(body(narrative.complianceEnforcement));

  // 6. References
  children.push(h1("6. References"));
  [
    `${meta.benchTitle}${meta.benchVersion ? `, ${meta.benchVersion}` : ""}`,
    "DISA Security Technical Implementation Guides — https://public.cyber.mil/stigs/",
    "NIST SP 800-53 Rev 5 — https://csrc.nist.gov/",
    `${meta.org} Corporate Cybersecurity Standards`,
  ].forEach((x) => children.push(bullet(x)));

  const doc = new Document({
    creator: "SecureHub",
    title: meta.title,
    description: `${meta.org} — ${meta.benchTitle}`,
    styles: {
      default: {
        document: { run: { font: "Calibri" } },
      },
    },
    sections: [{ properties: {}, children: children as unknown as (Paragraph | Table)[] }],
  });
  void AlignmentType;
  return Packer.toBuffer(doc);
}
