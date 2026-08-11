// Draft a full standard from a source URL: fetch the page, extract its structure,
// and have Claude (or the deterministic fallback) write the narrative — in English.
import { resolveNarrative } from "./policyNarrative";
import type { StandardContent } from "./standardDoc";

function stripTags(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}
function extractTitle(html: string): string {
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "";
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

export type DraftResult = { title: string; platform: string; content: StandardContent; aiUsed: boolean };

export async function draftStandardFromUrl(url: string): Promise<DraftResult> {
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 HardenHubBot", accept: "text/html,*/*" }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`Could not fetch the source (HTTP ${res.status}).`);
  const html = await res.text();
  const title = extractTitle(html);
  const sections = extractHeadings(html);
  const platform = guessPlatform(title);
  const { narrative, aiUsed } = await resolveNarrative({ org: "the organisation", platform, benchTitle: title, benchVersion: "", controlCount: sections.length, sectionTitles: sections });
  return { title, platform, aiUsed, content: { narrative, sections, sourceUrl: url, platform } };
}
