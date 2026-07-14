// Build a CCI → NIST 800-53 Rev 5 map from the DISA CCI list, then enrich each
// data/stig/<slug>.json control with the real NIST 800-53 controls it maps to.
// CCI list is public-domain U.S. Government content.

import fs from "fs";
import path from "path";

const cciXmlPath = process.argv[2];
const slugs = process.argv.slice(3);
if (!cciXmlPath || slugs.length === 0) {
  console.error("Usage: node scripts/enrich-cci.mjs <U_CCI_List.xml> <slug...>");
  process.exit(1);
}

const xml = fs.readFileSync(cciXmlPath, "utf8");
const map = {}; // CCI-000366 -> "CM-6"
const itemRe = /<cci_item id="(CCI-\d+)">([\s\S]*?)<\/cci_item>/g;
let m;
function baseControl(index) {
  const mm = index.match(/^([A-Z]{2}-\d+)/);
  return mm ? mm[1] : null;
}
while ((m = itemRe.exec(xml))) {
  const cci = m[1];
  const body = m[2];
  const refs = [...body.matchAll(/<reference[^>]*title="([^"]*)"[^>]*index="([^"]*)"[^>]*\/>/g)];
  // Prefer Revision 5, then 4, then any NIST 800-53 reference.
  const pick =
    refs.find((r) => /Revision 5/.test(r[1])) ||
    refs.find((r) => /Revision 4/.test(r[1])) ||
    refs.find((r) => /800-53/.test(r[1]));
  if (pick) {
    const ctrl = baseControl(pick[2]);
    if (ctrl) map[cci] = ctrl;
  }
}
const mapOut = path.join(process.cwd(), "data", "stig", "cci-nist.json");
fs.writeFileSync(mapOut, JSON.stringify(map));
console.log(`CCI→NIST map: ${Object.keys(map).length} entries → ${path.relative(process.cwd(), mapOut)}`);

for (const slug of slugs) {
  const p = path.join(process.cwd(), "data", "stig", `${slug}.json`);
  if (!fs.existsSync(p)) {
    console.warn(`  ${slug}: SKIP (no data file — import may have failed)`);
    continue;
  }
  const doc = JSON.parse(fs.readFileSync(p, "utf8"));
  let withNist = 0;
  for (const c of doc.controls) {
    const nist = [...new Set((c.ccis || []).map((cci) => map[cci]).filter(Boolean))];
    c.nist = nist;
    if (nist.length) withNist++;
  }
  fs.writeFileSync(p, JSON.stringify(doc, null, 1));
  console.log(`  ${slug}: ${withNist}/${doc.controls.length} controls mapped to NIST 800-53`);
}
