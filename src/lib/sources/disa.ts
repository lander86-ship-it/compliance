// Live DISA STIG connector — fetches on demand from the public cyber.trackr.live API
// (public-domain DoD content), so no benchmark data ships in the repo. Returns controls
// in the engine's FullControl shape so the generation pipeline is source-agnostic.

import { promises as fs } from "node:fs";
import path from "node:path";
import type { FullControl } from "../hub/controlContent";

const BASE = process.env.DISA_TRACKR_BASE || "https://cyber.trackr.live/api";
const CAT: Record<string, string> = { high: "CAT I", medium: "CAT II", low: "CAT III" };
const SEV: Record<string, string> = { high: "High", medium: "Medium", low: "Low" };

export type DisaGuideRef = {
  key: string; // trackr title key, e.g. "Red_Hat_Enterprise_Linux_9"
  name: string; // human name
  version: string;
  release: string;
  label: string; // e.g. "V2R4"
  link: string;
  sev: { h: number; m: number; l: number };
  controls: number;
};

let cciMap: Record<string, string> | null = null;
async function loadCciMap(): Promise<Record<string, string>> {
  if (cciMap) return cciMap;
  try {
    const p = path.join(process.cwd(), "data", "stig", "cci-nist.json");
    cciMap = JSON.parse(await fs.readFile(p, "utf8")) as Record<string, string>;
  } catch {
    cciMap = {};
  }
  return cciMap;
}

async function getJson<T>(pathname: string, tries = 4): Promise<T> {
  const url = pathname.startsWith("http") ? pathname : `${BASE}${pathname}`;
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (r.ok) return (await r.json()) as T;
      lastErr = new Error(`HTTP ${r.status}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise((res) => setTimeout(res, 500 * (i + 1)));
  }
  throw new Error(`DISA fetch failed (${url}): ${lastErr instanceof Error ? lastErr.message : lastErr}`);
}

function humanName(key: string): string {
  return key.replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

// Pick the newest version/release entry from a title's history.
function newest(entries: { version: string; release: string; link: string; sev?: { h: number; m: number; l: number } }[]) {
  return [...entries].sort((a, b) => Number(b.version) - Number(a.version) || Number(b.release) - Number(a.release))[0];
}

// The full live catalog of DISA STIGs (latest version of each), for search/browse.
export async function listGuides(): Promise<DisaGuideRef[]> {
  const index = await getJson<Record<string, { version: string; release: string; link: string; sev: { h: number; m: number; l: number } }[]>>("/stig");
  const out: DisaGuideRef[] = [];
  for (const [key, entries] of Object.entries(index)) {
    if (!Array.isArray(entries) || !entries.length) continue;
    const e = newest(entries);
    const sev = e.sev || { h: 0, m: 0, l: 0 };
    out.push({
      key,
      name: humanName(key),
      version: e.version,
      release: e.release,
      label: `V${e.version}R${e.release}`,
      link: e.link,
      sev,
      controls: (sev.h || 0) + (sev.m || 0) + (sev.l || 0),
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function searchGuides(query: string): Promise<DisaGuideRef[]> {
  const all = await listGuides();
  const q = query.trim().toLowerCase();
  if (!q) return all;
  return all.filter((g) => g.name.toLowerCase().includes(q) || g.key.toLowerCase().includes(q));
}

function familyOf(code: string): string {
  const m = (code || "").match(/^([A-Z0-9]+-[A-Z0-9]{2})/i);
  return m ? m[1].toUpperCase() : "General";
}

type ReqDetail = {
  id?: string; version?: string; rule?: string; group?: string;
  severity?: string; identifiers?: string[];
  "requirement-title"?: string; "requirement-description"?: string;
  "check-text"?: string; "fix-text"?: string;
};

// Fetch every control for a STIG (summary → per-requirement detail), mapped to FullControl.
export async function fetchControls(
  key: string, version: string, release: string,
  onProgress?: (done: number, total: number) => void,
): Promise<{ benchTitle: string; label: string; controls: FullControl[] }> {
  const cci = await loadCciMap();
  const summary = await getJson<{ title?: string; requirements?: unknown }>(`/stig/${key}/${version}/${release}`);
  const reqsRaw = summary.requirements || {};
  const reqs = (Array.isArray(reqsRaw) ? reqsRaw : Object.values(reqsRaw)) as { link: string }[];
  const total = reqs.length;
  let done = 0;

  const limit = 8;
  const results: (FullControl | null)[] = new Array(total);
  let idx = 0;
  async function worker() {
    while (idx < total) {
      const i = idx++;
      try {
        const d = await getJson<ReqDetail>(reqs[i].link);
        const sev = (d.severity || "medium").toLowerCase();
        const ccis = Array.isArray(d.identifiers) ? d.identifiers.filter((x) => /^CCI-/.test(x)) : [];
        const nist = [...new Set(ccis.map((c) => cci[c]).filter(Boolean))];
        const code = d.version || d.id || "";
        results[i] = {
          id: code,
          family: familyOf(code),
          title: (d["requirement-title"] || "").trim(),
          severity: SEV[sev] || "Medium",
          profile: CAT[sev] || "CAT II",
          rationale: (d["requirement-description"] || "").trim(),
          audit: (d["check-text"] || "").trim(),
          remediation: (d["fix-text"] || "").trim(),
          nist: nist.length ? nist.join(", ") : "—",
          csf: "—",
          iso: "—",
        };
      } catch {
        results[i] = null;
      }
      done++;
      if (onProgress && done % 10 === 0) onProgress(done, total);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, total) }, worker));
  onProgress?.(total, total);

  return {
    benchTitle: summary.title || humanName(key),
    label: `V${version}R${release}`,
    controls: results.filter((c): c is FullControl => c !== null),
  };
}
