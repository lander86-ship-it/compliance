// End-to-end check of the customer-template injector.
import { Document, Packer, Paragraph, TextRun } from "docx";
import JSZip from "jszip";
import { PDFDocument, rgb } from "pdf-lib";
import { injectPolicyIntoDocx, injectPolicyIntoPdf } from "../src/lib/policyTemplate";
import { staticNarrative } from "../src/lib/policyNarrative";
import { WINDOWS_CONTROLS } from "../src/lib/hub/controlContent";

(async () => {
  const meta = {
    org: "Northwind Financial Group", title: "Windows Server Hardening Standard",
    version: "1.0", author: "M. Torres, CISO", date: "2026-07-25", color: "#0f4c9c",
    classification: "Confidential", platform: "Windows Server 2022",
    benchTitle: "CIS Windows Server 2022 Benchmark", benchVersion: "v2.0.0",
  };
  const controls = WINDOWS_CONTROLS.slice(0, 8);
  const narrative = staticNarrative({ org: meta.org, platform: meta.platform, benchTitle: meta.benchTitle, benchVersion: meta.benchVersion, controlCount: controls.length, sectionTitles: [] });

  // ── Build a house-style DOCX template with placeholders (simulate Word run-splitting). ──
  const tplDoc = new Document({
    sections: [{ children: [
      new Paragraph({ children: [new TextRun({ text: "{{ORG}}", bold: true, size: 40 })] }),
      new Paragraph({ children: [new TextRun({ text: "{{TITLE}}", size: 32 })] }),
      new Paragraph({ children: [
        new TextRun({ text: "Version {{VERSION}} · " }),
        new TextRun({ text: "{{CLASSIFICATION}}" }),
        new TextRun({ text: " · {{DATE}}" }),
      ] }),
      new Paragraph({ children: [new TextRun({ text: "Owner: {{AUTHOR}} — Benchmark: {{BENCHMARK}}" })] }),
      new Paragraph({ children: [new TextRun({ text: "{{POLICY_BODY}}" })] }),
      new Paragraph({ children: [new TextRun({ text: "Confidential footer — do not distribute." })] }),
    ] }],
  });
  const tplBuf = await Packer.toBuffer(tplDoc);

  const outDocx = await injectPolicyIntoDocx(tplBuf, meta, controls, narrative);
  const zip = await JSZip.loadAsync(outDocx);
  const xml = await zip.file("word/document.xml")!.async("string");

  const checks: [string, boolean][] = [
    ["valid docx (has document.xml)", !!zip.file("word/document.xml")],
    ["ORG replaced", xml.includes("Northwind Financial Group") && !xml.includes("{{ORG}}")],
    ["TITLE replaced", xml.includes("Windows Server Hardening Standard") && !xml.includes("{{TITLE}}")],
    ["VERSION replaced (split runs healed)", !xml.includes("{{VERSION}}")],
    ["CLASSIFICATION replaced", !xml.includes("{{CLASSIFICATION}}")],
    ["BENCHMARK replaced", xml.includes("CIS Windows Server 2022 Benchmark (v2.0.0)")],
    ["POLICY_BODY marker gone", !xml.includes("{{POLICY_BODY}}")],
    ["body: Purpose heading injected", xml.includes("1. Purpose")],
    ["body: Security Requirements injected", xml.includes("4. Security Requirements")],
    ["body: a real control id present", xml.includes(controls[0].id)],
    ["footer preserved", xml.includes("Confidential footer")],
    ["Heading1 style referenced", xml.includes('w:pStyle w:val="Heading1"')],
  ];

  let ok = true;
  for (const [name, pass] of checks) { console.log(`${pass ? "✓" : "✗"} ${name}`); if (!pass) ok = false; }

  // ── PDF path: template pages become a cover prefix, content appended. ──
  const pdfTpl = await PDFDocument.create();
  const p = pdfTpl.addPage([595, 842]);
  p.drawText("NORTHWIND — Branded Cover", { x: 60, y: 760, size: 22, color: rgb(0.06, 0.3, 0.61) });
  const pdfTplBuf = Buffer.from(await pdfTpl.save());
  const outPdf = await injectPolicyIntoPdf(pdfTplBuf, meta, controls, narrative);
  const parsed = await PDFDocument.load(outPdf);
  const pdfOk = parsed.getPageCount() > 1;
  console.log(`${pdfOk ? "✓" : "✗"} PDF: cover + appended content (${parsed.getPageCount()} pages)`);
  if (!pdfOk) ok = false;

  console.log(ok ? "\nALL CHECKS PASSED" : "\nFAILURES PRESENT");
  process.exit(ok ? 0 : 1);
})();
