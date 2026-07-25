// End-to-end: policyPreview + generateArtifacts (with a customer DOCX template) via the engine.
import { Document, Packer, Paragraph, TextRun } from "docx";
import JSZip from "jszip";
import fs from "fs/promises";
import { policyPreview, generateArtifacts, type GenInput } from "../src/lib/generate";

(async () => {
  const scope = {
    legal: "Northwind Financial Group", trade: "Northwind", sector: "Financial services",
    owner: "M. Torres, CISO", docv: "1.0", classification: "Confidential", color: "#0f4c9c",
    env: "On-premises", profile: "Level 1", confidentiality: "Do not distribute.",
  };
  const base: GenInput = { productId: "cis-win2022", scope, odp: { pwlen: "16", lockout: "5", logret: "365", sessions: "15" }, excluded: [], included: [], formats: [] };

  // 1) Preview
  const pv = await policyPreview(base);
  console.log(`${pv.blocks.length > 10 ? "✓" : "✗"} preview produced ${pv.blocks.length} blocks (aiUsed=${pv.aiUsed})`);
  console.log(`${pv.blocks.some((b) => b.t === "h1" && b.text.includes("Security Requirements")) ? "✓" : "✗"} preview has Security Requirements section`);

  // 2) Build a DOCX template and generate through it
  const tpl = new Document({ sections: [{ children: [
    new Paragraph({ children: [new TextRun({ text: "{{ORG}}", bold: true, size: 40 })] }),
    new Paragraph({ children: [new TextRun({ text: "{{TITLE}} — {{BENCHMARK}}" })] }),
    new Paragraph({ children: [new TextRun({ text: "{{POLICY_BODY}}" })] }),
  ] }] });
  const tplB64 = (await Packer.toBuffer(tpl)).toString("base64");

  const input: GenInput = { ...base, formats: ["POLICY", "DOCX", "XLSX"], template: { base64: tplB64, type: "docx", name: "house-style.docx" } };
  const arts = await generateArtifacts(input, "e2e-test-job");
  const policy = arts.find((a) => a.format === "POLICY");
  console.log(`${policy ? "✓" : "✗"} POLICY artifact produced: ${policy?.fileName}`);
  console.log(`${policy?.fileName.endsWith(".policy.docx") ? "✓" : "✗"} POLICY uses templated .policy.docx extension`);

  // 3) Verify templated output contains injected content + preserved template text, no leftover markers
  const buf = await fs.readFile(`./storage/${policy!.fileName}`);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file("word/document.xml")!.async("string");
  const checks: [string, boolean][] = [
    ["ORG replaced in template", xml.includes("Northwind Financial Group") && !xml.includes("{{ORG}}")],
    ["POLICY_BODY marker gone", !xml.includes("{{POLICY_BODY}}")],
    ["injected 1. Purpose", xml.includes("1. Purpose")],
    ["ODP 16 substituted into remediation", xml.includes("16")],
  ];
  let ok = pv.blocks.length > 10 && !!policy && policy!.fileName.endsWith(".policy.docx");
  for (const [n, p] of checks) { console.log(`${p ? "✓" : "✗"} ${n}`); if (!p) ok = false; }

  // cleanup generated test artifacts
  for (const a of arts) await fs.unlink(`./storage/${a.fileName}`).catch(() => {});
  console.log(ok ? "\nE2E PASSED" : "\nE2E FAILURES");
  process.exit(ok ? 0 : 1);
})();
