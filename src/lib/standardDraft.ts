// Draft a full standard from a source URL. Fetch the page, extract its ACTUAL text,
// and have Claude author a faithful, source-grounded standard (real requirements — see
// standardAuthor). Falls back to a lighter deterministic draft only if the model is
// unavailable or fails, so the tool never breaks.
import { resolveNarrative } from "./policyNarrative";
import { extractReadable, authorStandard } from "./standardAuthor";
import type { StandardContent } from "./standardDoc";

function stripTags(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}
function extractTitle(html: string): string {
  const t = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "";
  return stripTags(t).slice(0, 160) || "Imported standard";
}
function extractHeadings(html: string): string[] {
  const out: string[] = []; const re = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi; let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < 60) { const t = stripTags(m[2]); if (t && t.length > 2 && t.length < 140) out.push(t); }
  return [...new Set(out)];
}
function guessPlatform(title: string): string {
  const t = title.toLowerCase();
  for (const [k, v] of [["windows", "Windows"], ["ubuntu", "Ubuntu Linux"], ["red hat", "Red Hat Enterprise Linux"], ["rhel", "Red Hat Enterprise Linux"], ["kubernetes", "Kubernetes"], ["docker", "Docker"], ["aws", "Amazon Web Services"], ["azure", "Microsoft Azure"], ["oracle", "Oracle Database"], ["mysql", "MySQL"], ["mongodb", "MongoDB"], ["apache", "Apache"], ["cisco", "Cisco"], ["vmware", "VMware"], ["macos", "Apple macOS"], ["debian", "Debian Linux"], ["nist", "NIST framework"], ["iso 27001", "ISO 27001"], ["pci", "PCI DSS"]] as const) if (t.includes(k)) return v;
  return "the referenced technology";
}

// Extract plain text from a PDF buffer (CIS/DISA/NIST sources are often PDFs).
async function pdfToText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const res = await parser.getText();
    return (res.text || "").replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  } finally {
    await parser.destroy?.().catch(() => {});
  }
}

export type DraftResult = { title: string; platform: string; content: StandardContent; aiUsed: boolean };

export async function draftStandardFromUrl(url: string): Promise<DraftResult> {
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 HardenHubBot", accept: "text/html,application/xhtml+xml,application/pdf,*/*" }, signal: AbortSignal.timeout(45000) });
  if (!res.ok) throw new Error(`Could not fetch the source (HTTP ${res.status}).`);
  const contentType = res.headers.get("content-type") || "";
  const isPdf = /application\/pdf/i.test(contentType) || /\.pdf($|\?)/i.test(url);

  // PDF sources: extract the text, then author from it (no HTML title/headings available).
  if (isPdf) {
    const buffer = Buffer.from(await res.arrayBuffer());
    const sourceText = await pdfToText(buffer).catch(() => "");
    if (sourceText.length < 200) throw new Error("Couldn't read text from this PDF (it may be scanned/image-only). Try an HTML source or a text-based PDF.");
    const fallbackTitle = (sourceText.split("\n").find((l) => l.trim().length > 8)?.trim() || "Imported standard").slice(0, 160);
    const authored = await authorStandard(url, fallbackTitle, sourceText);
    if (!authored) throw new Error("The AI author is unavailable (set ANTHROPIC_API_KEY). PDF sources require it.");
    return {
      title: authored.title,
      platform: authored.platform,
      aiUsed: true,
      content: { narrative: authored.narrative, sections: authored.requirementSections.map((s) => s.heading), requirementSections: authored.requirementSections, summary: authored.summary || undefined, references: authored.references, sourceUrl: url, platform: authored.platform },
    };
  }

  const html = await res.text();
  const fallbackTitle = extractTitle(html);
  const sourceText = extractReadable(html);

  // Primary path: Claude reads the real source text and authors a grounded standard.
  const authored = await authorStandard(url, fallbackTitle, sourceText);
  if (authored) {
    return {
      title: authored.title,
      platform: authored.platform,
      aiUsed: true,
      content: {
        narrative: authored.narrative,
        sections: authored.requirementSections.map((s) => s.heading),
        requirementSections: authored.requirementSections,
        summary: authored.summary || undefined,
        references: authored.references,
        sourceUrl: url,
        platform: authored.platform,
      },
    };
  }

  // Fallback: no API key or the model failed — keep the lighter deterministic draft.
  const sections = extractHeadings(html);
  const platform = guessPlatform(fallbackTitle);
  const { narrative, aiUsed } = await resolveNarrative({ org: "the organization", platform, benchTitle: fallbackTitle, benchVersion: "", controlCount: sections.length, sectionTitles: sections });
  return { title: fallbackTitle, platform, aiUsed, content: { narrative, sections, sourceUrl: url, platform } };
}
