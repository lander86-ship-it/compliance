// Unified source layer: one interface over the live connectors so the UI and the
// generation engine are source-agnostic. DISA is public (live now); CIS runs through
// the cis-bench CLI (available once CIS WorkBench credentials are configured).

import type { FullControl } from "../hub/controlContent";
import type { SourceId } from "../hub/data";
import * as disa from "./disa";
import * as cisbench from "./cisbench";
import { parseXccdf } from "./cisXccdf";

export type GuideRef = {
  source: SourceId;
  ref: string; // opaque id the connector understands (e.g. "key/version/release" or a CIS benchmark id)
  name: string;
  label: string; // version label, e.g. "V2R4" / "v2.0.0"
  controls: number; // best-known count (may be approximate before fetch)
};

export type FetchedGuide = { benchTitle: string; label: string; controls: FullControl[] };

export type SourceStatus = { id: SourceId; available: boolean; detail: string };

export interface SourceConnector {
  id: SourceId;
  status(): Promise<SourceStatus>;
  search(query: string): Promise<GuideRef[]>;
  fetch(ref: string, onProgress?: (done: number, total: number) => void): Promise<FetchedGuide>;
}

// ── DISA (public, live via cyber.trackr.live) ──
const disaConnector: SourceConnector = {
  id: "disa",
  async status() {
    return { id: "disa", available: true, detail: "Live — public DISA STIG library (no credentials required)." };
  },
  async search(query) {
    const guides = await disa.searchGuides(query);
    return guides.map((g) => ({ source: "disa" as const, ref: `${g.key}/${g.version}/${g.release}`, name: g.name, label: g.label, controls: g.controls }));
  },
  async fetch(ref, onProgress) {
    const [key, version, release] = ref.split("/");
    return disa.fetchControls(key, version, release, onProgress);
  },
};

// ── CIS (via cis-bench + CIS WorkBench: form login → export XCCDF → parse) ──
function pickList(items: unknown): Record<string, unknown>[] {
  if (Array.isArray(items)) return items as Record<string, unknown>[];
  if (items && typeof items === "object") {
    for (const k of ["benchmarks", "results", "items", "data", "records"]) {
      const v = (items as Record<string, unknown>)[k];
      if (Array.isArray(v)) return v as Record<string, unknown>[];
    }
  }
  return [];
}

const cisConnector: SourceConnector = {
  id: "cis",
  async status() {
    const cli = await cisbench.cliAvailable();
    if (!cli) return { id: "cis", available: false, detail: "cis-bench CLI not installed in this runtime (Docker image adds it)." };
    const auth = await cisbench.ensureAuth();
    return { id: "cis", available: auth.ok, detail: auth.ok ? "Live — authenticated to CIS WorkBench." : auth.detail };
  },
  async search(query) {
    await cisbench.ensureAuth();
    const res = await cisbench.search(query);
    if (!res.ok) return [];
    let items: unknown = [];
    try { items = JSON.parse(res.stdout); } catch { return []; }
    return pickList(items)
      .map((o): GuideRef | null => {
        const id = String(o.id ?? o.benchmark_id ?? o.identifier ?? o.workbench_id ?? "");
        const name = String(o.title ?? o.name ?? id);
        if (!id) return null;
        return { source: "cis", ref: id, name, label: String(o.version ?? o.benchmark_version ?? ""), controls: Number(o.controls ?? o.rule_count ?? 0) };
      })
      .filter((x): x is GuideRef => x !== null);
  },
  async fetch(ref) {
    const auth = await cisbench.ensureAuth();
    if (!auth.ok) throw new Error(`CIS not connected: ${auth.detail}`);
    const { data } = await cisbench.exportBytes(ref, "xccdf", "cis");
    if (!data) throw new Error("cis-bench could not export this CIS benchmark (check the benchmark id / your CIS licence).");
    const parsed = parseXccdf(data);
    if (!parsed.controls.length) throw new Error("No controls parsed from the CIS benchmark export.");
    return { benchTitle: parsed.benchTitle, label: parsed.version, controls: parsed.controls };
  },
};

const REGISTRY: Record<SourceId, SourceConnector> = { disa: disaConnector, cis: cisConnector };

export function connector(source: SourceId): SourceConnector {
  const c = REGISTRY[source];
  if (!c) throw new Error(`Unknown source: ${source}`);
  return c;
}

export async function sourceStatuses(): Promise<SourceStatus[]> {
  return Promise.all([disaConnector.status(), cisConnector.status()]);
}
