// Server-side loader for ingested DISA STIG data (public-domain, reproduction permitted).
// Reads the JSON produced by scripts/import-xccdf.mjs + enrich-cci.mjs.

import fs from "fs";
import path from "path";
import type { FullControl } from "./controlContent";

export type StigControl = {
  code: string;
  vulnId: string;
  ruleId: string;
  title: string;
  severity: string; // high | medium | low
  cat: string; // CAT I | CAT II | CAT III
  srg: string;
  rationale: string;
  audit: string;
  remediation: string;
  ccis: string[];
  nist: string[];
};
export type StigDoc = { slug: string; benchTitle: string; release: string; controls: StigControl[] };

// Product slug (catalog) → ingested STIG data file.
export const STIG_PRODUCTS: Record<string, { slug: string; name: string; platform: string; version: string }> = {
  "stig-rhel9": { slug: "stig-rhel9", name: "DISA STIG — Red Hat Enterprise Linux 9", platform: "Linux", version: "V2R4" },
  "stig-win2022": { slug: "stig-win2022", name: "DISA STIG — Microsoft Windows Server 2022", platform: "Windows Server", version: "V2R4" },
  "stig-win2019": { slug: "stig-win2019", name: "DISA STIG — Microsoft Windows Server 2019", platform: "Windows Server", version: "V3R5" },
  "stig-win11": { slug: "stig-win11", name: "DISA STIG — Microsoft Windows 11", platform: "Windows", version: "V2R4" },
  "stig-ubuntu2204": { slug: "stig-ubuntu2204", name: "DISA STIG — Canonical Ubuntu 22.04 LTS", platform: "Linux", version: "V2R5" },
  "stig-k8s": { slug: "stig-k8s", name: "DISA STIG — Kubernetes", platform: "Kubernetes", version: "V2R4" },
  "stig-macos14": { slug: "stig-macos14", name: "DISA STIG — Apple macOS 14 (Sonoma)", platform: "macOS", version: "V2R4" },
  "stig-postgresql": { slug: "stig-postgresql", name: "DISA STIG — Crunchy Data PostgreSQL", platform: "Database", version: "V2R2" },
  "stig-cisco-ios-rtr": { slug: "stig-cisco-ios-rtr", name: "DISA STIG — Cisco IOS XE Router (RTR)", platform: "Network", version: "V3R1" },
};

const cache = new Map<string, StigDoc | null>();

export function loadStig(slug: string): StigDoc | null {
  if (cache.has(slug)) return cache.get(slug)!;
  const p = path.join(process.cwd(), "data", "stig", `${slug}.json`);
  let doc: StigDoc | null = null;
  try {
    doc = JSON.parse(fs.readFileSync(p, "utf8")) as StigDoc;
  } catch {
    doc = null;
  }
  cache.set(slug, doc);
  return doc;
}

export function isStigProduct(productId: string): boolean {
  return productId in STIG_PRODUCTS;
}

const CAT_TO_SEV: Record<string, string> = { "CAT I": "High", "CAT II": "Medium", "CAT III": "Low" };

// Family = the STIG id group prefix (e.g. "RHEL-09-21", "WN22-AC"), for grouping controls.
export function familyOf(c: StigControl): string {
  const m = (c.code || "").match(/^([A-Z0-9]+-[A-Z0-9]{2})/i);
  return m ? m[1].toUpperCase() : "General";
}

// Normalize a STIG control to the engine's FullControl shape.
export function toFullControl(c: StigControl): FullControl {
  return {
    id: c.code,
    family: familyOf(c),
    title: c.title,
    severity: CAT_TO_SEV[c.cat] || "Medium",
    profile: c.cat,
    rationale: c.rationale,
    audit: c.audit,
    remediation: c.remediation, // STIG remediation has no ODP placeholders → passthrough
    nist: c.nist && c.nist.length ? c.nist.join(", ") : "—",
    csf: "—",
    iso: "—",
  };
}

// Lightweight control list for the Scope Wizard (id/title/family/severity only).
export function stigControlSummaries(slug: string) {
  const doc = loadStig(slug);
  if (!doc) return [];
  return doc.controls.map((c) => ({ id: c.code, title: c.title, family: familyOf(c), severity: CAT_TO_SEV[c.cat] || "Medium", cat: c.cat }));
}
