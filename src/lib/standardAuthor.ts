// Author a real, source-grounded security standard from a document URL.
//
// For large, comprehensive sources (e.g. NIST SP 800-53, a full STIG) a single model call
// would either truncate or summarise the controls away. So we process the WHOLE source in
// chunks: each chunk is mined for ALL of its requirements (exhaustively, faithfully), the
// results are merged into one large set of requirement sections, and a separate pass writes
// the surrounding narrative. Falls back to a deterministic draft only when no API key is set.

import { staticNarrative, type Narrative, type Role } from "./policyNarrative";
import type { ReqSection } from "./standardDoc";

const MODEL = process.env.POLICY_LLM_MODEL || "claude-opus-4-8";
const CHUNK_CHARS = 24_000;   // ~6k tokens of source per extraction call — safe against output truncation
const MAX_CHUNKS = 14;        // cover up to ~336k chars of source (a large framework/STIG)
const CONCURRENCY = 4;        // parallel model calls, bounded to avoid rate spikes
const MAX_OUTPUT_TOKENS = 16_000;

// Raised when the model call itself fails; a missing API key returns null instead.
export class AuthorError extends Error {}

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

export function aiAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

// ── Anthropic call ───────────────────────────────────────────────────
async function callClaude(system: string, user: string): Promise<{ text: string; stop: string }> {
  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY as string, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: MAX_OUTPUT_TOKENS, system, messages: [{ role: "user", content: user }] }),
      signal: AbortSignal.timeout(240_000),
    });
  } catch (e) {
    const m = e instanceof Error ? e.message : "network error";
    throw new AuthorError(`Could not reach the AI author (${/aborted|timeout/i.test(m) ? "timed out" : m}).`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let msg = `Anthropic API error ${res.status}`;
    try { const j = JSON.parse(body); if (j?.error?.message) msg += `: ${j.error.message}`; } catch { /* raw */ }
    throw new AuthorError(msg);
  }
  const data = await res.json();
  const text: string = (data.content || []).filter((b: { type: string }) => b.type === "text").map((b: { text?: string }) => b.text || "").join("");
  return { text, stop: data.stop_reason || "" };
}

function extractJson(text: string): Record<string, unknown> | null {
  const s = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  try { return JSON.parse(s); } catch { return null; }
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : []);

// Split source text into chunks on paragraph/line boundaries, capped in count.
function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let buf = "";
  for (const line of text.split("\n")) {
    if (buf.length + line.length + 1 > CHUNK_CHARS && buf) { chunks.push(buf); buf = ""; }
    // A single very long line: hard-split it.
    if (line.length > CHUNK_CHARS) {
      for (let i = 0; i < line.length; i += CHUNK_CHARS) chunks.push(line.slice(i, i + CHUNK_CHARS));
      continue;
    }
    buf += (buf ? "\n" : "") + line;
  }
  if (buf) chunks.push(buf);
  return chunks.slice(0, MAX_CHUNKS);
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// ── Pass 1: exhaustive requirement extraction per chunk ──────────────
const EXTRACT_SYSTEM =
  "You are a senior information-security standards author. You are given ONE EXCERPT of a larger source " +
  "document (a control catalog, benchmark, STIG or framework). Extract EVERY distinct requirement/control " +
  "present in this excerpt and rewrite each as a clear, enforceable statement using 'shall'.\n" +
  "Rules:\n" +
  "- Be EXHAUSTIVE. Do NOT summarise, sample, merge or omit controls. If the excerpt lists 40 controls, " +
  "produce ~40 requirement statements. Preserve control identifiers (e.g. AC-2, 1.1.1), specific settings, " +
  "thresholds and values.\n" +
  "- Group the requirements into sections that match the source's own families/sections.\n" +
  "- One concise sentence per requirement. Formal English. No markdown.\n" +
  "- Output STRICT JSON only: {\"requirementSections\":[{\"heading\":string,\"intro\":string,\"requirements\":string[]}]}.";

async function extractChunk(chunk: string, i: number, total: number): Promise<ReqSection[]> {
  const user =
    `EXCERPT ${i + 1} of ${total} of the source document:\n"""\n${chunk}\n"""\n\n` +
    `Return the JSON described. Include every control/requirement found in THIS excerpt.`;
  const { text } = await callClaude(EXTRACT_SYSTEM, user);
  const p = extractJson(text);
  const raw = p && Array.isArray(p.requirementSections) ? (p.requirementSections as { heading?: unknown; intro?: unknown; requirements?: unknown }[]) : [];
  return raw
    .map((s) => ({ heading: str(s.heading) || "Requirements", intro: str(s.intro) || undefined, requirements: arr(s.requirements) }))
    .filter((s) => s.requirements.length > 0);
}

// Merge sections from all chunks: same heading → one section, requirements concatenated (exact dupes dropped).
function mergeSections(all: ReqSection[][]): ReqSection[] {
  const order: string[] = [];
  const map = new Map<string, ReqSection>();
  for (const list of all) {
    for (const sec of list) {
      const key = sec.heading.toLowerCase().replace(/\s+/g, " ").trim();
      const cur = map.get(key);
      if (!cur) { map.set(key, { heading: sec.heading, intro: sec.intro, requirements: [...sec.requirements] }); order.push(key); }
      else {
        const seen = new Set(cur.requirements.map((r) => r.toLowerCase()));
        for (const r of sec.requirements) if (!seen.has(r.toLowerCase())) { cur.requirements.push(r); seen.add(r.toLowerCase()); }
        if (!cur.intro && sec.intro) cur.intro = sec.intro;
      }
    }
  }
  return order.map((k) => map.get(k)!);
}

// ── Pass 2: the surrounding narrative + metadata ─────────────────────
const NARRATIVE_SYSTEM =
  "You draft the framing of a corporate Security Standard grounded in a source document. Formal English, " +
  "no markdown, one idea per string. Output STRICT JSON only.";

async function authorNarrative(url: string, fallbackTitle: string, overview: string, headings: string[]): Promise<Partial<Authored> & { narrative: Narrative }> {
  const user =
    `Source URL: ${url}\nSource overview (start of the document):\n"""\n${overview.slice(0, 24_000)}\n"""\n\n` +
    `The standard's requirement sections are: ${headings.slice(0, 60).join("; ")}.\n\n` +
    `Return JSON with keys: title (proper standard title), platform (technology/framework governed), ` +
    `summary (1-2 sentences for a catalog), purposeIntro (paragraph), purposeAims (string[3-5]), ` +
    `scopeIntro (paragraph, refer to "the organization"), scopeCovers (string[3-6]), ` +
    `roles (array of {role, responsibilities:string[]}, 4-6), complianceIntro (string), ` +
    `complianceEnforcement (string), references (string[]).`;
  const base = staticNarrative({ org: "the organization", platform: "the referenced technology", benchTitle: fallbackTitle, benchVersion: "", controlCount: 0, sectionTitles: [] });
  let p: Record<string, unknown> | null = null;
  try { p = extractJson((await callClaude(NARRATIVE_SYSTEM, user)).text); } catch { p = null; }
  if (!p) return { title: fallbackTitle, platform: "the referenced technology", summary: "", references: [], narrative: base };
  const roles: Role[] = Array.isArray(p.roles) && (p.roles as unknown[]).length
    ? (p.roles as Role[]).filter((r) => r && r.role).map((r) => ({ role: str(r.role), responsibilities: arr(r.responsibilities) }))
    : base.roles;
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
  return { title: str(p.title) || fallbackTitle, platform: str(p.platform) || "the referenced technology", summary: str(p.summary), references: arr(p.references), narrative };
}

// ── Orchestration ────────────────────────────────────────────────────
export async function authorStandard(url: string, fallbackTitle: string, sourceText: string): Promise<Authored | null> {
  if (!aiAvailable()) return null; // no key → caller decides (HTML falls back, PDF errors)
  if (!sourceText.trim()) throw new AuthorError("No readable text could be extracted from the source.");

  const chunks = chunkText(sourceText);
  const truncatedSource = sourceText.length > chunks.join("\n").length + 5;

  // Pass 1: mine every chunk for its requirements, in parallel (bounded), tolerating partial failures.
  let firstError: AuthorError | null = null;
  const perChunk = await mapLimit(chunks, CONCURRENCY, async (c, i) => {
    try { return await extractChunk(c, i, chunks.length); }
    catch (e) { if (e instanceof AuthorError && !firstError) firstError = e; return [] as ReqSection[]; }
  });
  const requirementSections = mergeSections(perChunk);
  if (requirementSections.length === 0) {
    if (firstError) throw firstError;
    throw new AuthorError("No requirements could be extracted — make sure the link points to the actual controls/requirements, not a landing or summary page.");
  }

  // Pass 2: the framing narrative + metadata.
  const meta = await authorNarrative(url, fallbackTitle, sourceText, requirementSections.map((s) => s.heading));

  // Note in the references when the source was longer than we could process.
  const references = meta.references || [];
  if (truncatedSource) references.push("Note: the source document was very large; the most substantial portion was processed. Verify completeness against the full source.");

  return {
    title: meta.title || fallbackTitle,
    platform: meta.platform || "the referenced technology",
    summary: meta.summary || "",
    narrative: meta.narrative,
    requirementSections,
    references,
  };
}
