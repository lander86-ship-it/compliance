// Importer via the cyber.trackr.live API — a public index of DISA STIGs (public-domain content).
// Fetches a STIG's requirement list + each requirement's detail and writes the same normalized
// data/stig/<slug>.json as scripts/import-xccdf.mjs.
//
// Usage: node scripts/import-trackr.mjs <Title_Key> <version> <release> <slug>

import fs from "fs";
import path from "path";

const [, , title, version, release, slug] = process.argv;
if (!title || !version || !release || !slug) {
  console.error("Usage: node scripts/import-trackr.mjs <Title_Key> <version> <release> <slug>");
  process.exit(1);
}

const BASE = "https://cyber.trackr.live/api";
const CAT = { high: "CAT I", medium: "CAT II", low: "CAT III" };

async function getJson(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (r.ok) return await r.json();
    } catch {
      /* retry */
    }
    await new Promise((res) => setTimeout(res, 500 * (i + 1)));
  }
  throw new Error(`failed: ${url}`);
}

// Simple concurrency-limited map.
async function pmap(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
      if (idx % 25 === 0) process.stdout.write(".");
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return out;
}

const summary = await getJson(`${BASE}/stig/${title}/${version}/${release}`);
const reqsRaw = summary.requirements || {};
const reqs = Array.isArray(reqsRaw) ? reqsRaw : Object.values(reqsRaw);
console.log(`${slug}: ${reqs.length} requirements — fetching details`);

const controlsRaw = await pmap(reqs, 6, async (req) => {
  let d;
  try {
    d = await getJson(`${BASE}${req.link}`);
  } catch {
    return null;
  }
  const sev = (d.severity || "medium").toLowerCase();
  return {
    code: d.version || d.id,
    vulnId: d.id,
    ruleId: d.rule,
    title: (d["requirement-title"] || "").trim(),
    severity: sev,
    cat: CAT[sev] || "CAT II",
    srg: d.group || "",
    rationale: (d["requirement-description"] || "").trim(),
    audit: (d["check-text"] || "").trim(),
    remediation: (d["fix-text"] || "").trim(),
    ccis: Array.isArray(d.identifiers) ? d.identifiers.filter((x) => /^CCI-/.test(x)) : [],
  };
});
process.stdout.write("\n");
const controls = controlsRaw.filter(Boolean);
if (controls.length < reqs.length) console.warn(`  warning: ${reqs.length - controls.length} requirement(s) failed to fetch`);

const outDir = path.join(process.cwd(), "data", "stig");
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `${slug}.json`);
fs.writeFileSync(out, JSON.stringify({ slug, benchTitle: summary.title, release: `V${version}R${release}`, controls }, null, 1));
const sev = controls.reduce((a, c) => ((a[c.cat] = (a[c.cat] || 0) + 1), a), {});
console.log(`${slug}: ${controls.length} controls  ${JSON.stringify(sev)}  → ${path.relative(process.cwd(), out)}`);
