// Author a real, source-grounded security standard from a document URL.
//
// Unlike the old "scrape headings + generic narrative" approach, this reads the actual
// text of the source document and asks Claude to extract its concrete requirements and
// rewrite them as enforceable "shall" statements grouped into sections — a faithful,
// substantive standard, not boilerplate. Falls back to a deterministic draft only if no
// API key is configured or the model call fails.

import { staticNarrative, type Narrative, type Role } from "./policyNarrative";
import type { ReqSection } from "./standardDoc";

const MODEL = process.env.POLICY_LLM_MODEL || "claude-opus-4-8";
const MAX_SOURCE_CHARS = 48_000; // ~12k tokens of source text — plenty for a benchmark/STIG page

export type Authored = {
  title: string;
  platform: string;
  summary: string;
  narrative: Narrative;
  requirementSections: ReqSection[];
  references: string[];
};

// ── HTML → readable text ─────────────────────────────────────────────
const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", mdash: "—", ndash: "–", hellip: "…", rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"' };
function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => { try { return String.fromCodePoint(Number(n)); } catch { return " "; } })
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => { try { return String.fromCodePoint(parseInt(n, 16)); } catch { return " "; } })
    .replace(/&([a-z]+);/gi, (m, k) => ENTITIES[k.toLowerCase()] ?? " ");
}

// Extract the main readable text: drop non-content elements, prefer <main>/<article>,
// keep line structure around block elements so lists/headings survive as separate lines.
export function extractReadable(html: string): string {
  let s = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|head|nav|header|footer|form)[\s\S]*?<\/\1>/gi, " ");
  const main = s.match(/<(?:main|article)[^>]*>([\s\S]*?)<\/(?:main|article)>/i);
  if (main) s = main[1];
  s = s
    .replace(/<\/(p|div|li|tr|h[1-6]|section|ul|ol|table|thead|tbody|br)\s*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  s = decodeEntities(s)
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return s;
}

// ── Claude authoring ─────────────────────────────────────────────────
export function aiAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

const SYSTEM =
  "You are a senior information-security standards author. You are given the full text of a source " +
  "technical document (a CIS Benchmark, DISA STIG, NIST/ISO/PCI framework, or vendor hardening guide) " +
  "and you write a rigorous, faithful corporate Security Standard grounded ONLY in that source.\n\n" +
  "Rules:\n" +
  "- Extract the concrete, testable requirements actually present in the source and rewrite each as a " +
  "clear, enforceable requirement statement (use 'shall'). Preserve specific settings, thresholds, " +
  "values and control identifiers when the source gives them.\n" +
  "- Group requirements into logical sections that reflect the source's own structure/domains.\n" +
  "- Be comprehensive: cover the major requirement areas of the source. Do NOT invent controls the " +
  "source does not support, and do NOT pad with generic filler.\n" +
  "- Formal enterprise English. No markdown, no bullet characters, one requirement per string.\n" +
  "- Output STRICT JSON only (no prose, no code fences).";

function userPrompt(url: string, sourceText: string): string {
  return (
    `Source URL: ${url}\n\n` +
    `SOURCE DOCUMENT TEXT (may be truncated):\n"""\n${sourceText.slice(0, MAX_SOURCE_CHARS)}\n"""\n\n` +
    `Write the Security Standard as a JSON object with EXACTLY these keys:\n` +
    `{\n` +
    `  "title": string,                 // proper standard title, e.g. "Microsoft Windows Server 2022 Security Hardening Standard"\n` +
    `  "platform": string,              // the technology/framework the standard governs\n` +
    `  "summary": string,               // 1-2 sentence description for a catalog listing\n` +
    `  "purposeIntro": string,          // one paragraph\n` +
    `  "purposeAims": string[],         // 3-5 aims\n` +
    `  "scopeIntro": string,            // one paragraph; refer to "the organization"\n` +
    `  "scopeCovers": string[],         // 3-6 items\n` +
    `  "roles": [{"role": string, "responsibilities": string[]}],  // 4-6 roles\n` +
    `  "requirementSections": [{"heading": string, "intro": string, "requirements": string[]}],  // THE CORE: 5-14 sections, each with 3-15 concrete "shall" requirements taken from the source\n` +
    `  "complianceIntro": string,\n` +
    `  "complianceEnforcement": string,\n` +
    `  "references": string[]           // the source plus any frameworks it maps to\n` +
    `}\n` +
    `Make requirementSections the substantial majority of the content and keep it faithful to the source.`
  );
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : []);

export async function authorStandard(url: string, fallbackTitle: string, sourceText: string): Promise<Authored | null> {
  if (!aiAvailable() || !sourceText.trim()) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY as string,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8000,
        system: SYSTEM,
        messages: [{ role: "user", content: userPrompt(url, sourceText) }],
      }),
      signal: AbortSignal.timeout(180_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = (data.content || []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
    const jsonStr = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const p = JSON.parse(jsonStr);

    const sections: ReqSection[] = Array.isArray(p.requirementSections)
      ? p.requirementSections
          .map((s: { heading?: unknown; intro?: unknown; requirements?: unknown }) => ({ heading: str(s.heading) || "Requirements", intro: str(s.intro) || undefined, requirements: arr(s.requirements) }))
          .filter((s: ReqSection) => s.requirements.length > 0)
      : [];
    // A result with no real requirements isn't an improvement over the fallback.
    if (sections.length === 0) return null;

    const roles: Role[] = Array.isArray(p.roles) && p.roles.length
      ? p.roles.filter((r: Role) => r && r.role).map((r: Role) => ({ role: str(r.role), responsibilities: arr(r.responsibilities) }))
      : staticNarrative({ org: "the organization", platform: str(p.platform), benchTitle: fallbackTitle, benchVersion: "", controlCount: 0, sectionTitles: [] }).roles;

    const base = staticNarrative({ org: "the organization", platform: str(p.platform) || "the in-scope technology", benchTitle: str(p.title) || fallbackTitle, benchVersion: "", controlCount: 0, sectionTitles: [] });
    const narrative: Narrative = {
      purposeIntro: str(p.purposeIntro) || base.purposeIntro,
      purposePoints: base.purposePoints,
      purposeAims: arr(p.purposeAims).length ? arr(p.purposeAims) : base.purposeAims,
      scopeIntro: str(p.scopeIntro) || base.scopeIntro,
      scopeAppliesTo: base.scopeAppliesTo,
      scopeCovers: arr(p.scopeCovers).length ? arr(p.scopeCovers) : base.scopeCovers,
      roles,
      complianceIntro: str(p.complianceIntro) || base.complianceIntro,
      complianceExceptionFields: base.complianceExceptionFields,
      complianceEnforcement: str(p.complianceEnforcement) || base.complianceEnforcement,
    };

    return {
      title: str(p.title) || fallbackTitle,
      platform: str(p.platform) || "the referenced technology",
      summary: str(p.summary),
      narrative,
      requirementSections: sections,
      references: arr(p.references),
    };
  } catch {
    return null;
  }
}
