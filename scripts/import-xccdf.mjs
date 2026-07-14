// XCCDF importer (FR-A-03/04): parses a DISA STIG Manual XCCDF (.xml) into normalized
// Control records and writes compact JSON to data/stig/<slug>.json.
//
// DISA STIGs are U.S. Government public-domain content (reproduction/derivatives permitted),
// so the parsed text is safe to store and resell — unlike copyrighted CIS Benchmarks.
//
// Usage: node scripts/import-xccdf.mjs <path-to-xccdf.xml> <slug>

import fs from "fs";
import path from "path";

function decode(s) {
  if (!s) return "";
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}
function tag(block, name) {
  const m = block.match(new RegExp("<" + name + "[^>]*>([\\s\\S]*?)<\\/" + name + ">"));
  return m ? m[1] : "";
}
function attr(open, name) {
  const m = open.match(new RegExp(name + '="([^"]*)"'));
  return m ? m[1] : "";
}
// Pull a sub-field out of the escaped VulnDiscussion-style description blob.
function subField(text, name) {
  const m = text.match(new RegExp("<" + name + ">([\\s\\S]*?)<\\/" + name + ">"));
  return m ? m[1].trim() : "";
}

const CAT = { high: "CAT I", medium: "CAT II", low: "CAT III" };

export function parseXccdf(xml) {
  const benchTitle = decode(tag(xml, "title"));
  const releaseInfo = (xml.match(/Release:\s*([^<]+)/) || [])[1] || "";
  const controls = [];

  const groupRe = /<Group id="(V-\d+|[^"]+)">([\s\S]*?)<\/Group>/g;
  let g;
  while ((g = groupRe.exec(xml))) {
    const vulnId = g[1];
    const gb = g[2];
    const srg = decode((gb.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "");
    const ruleOpen = (gb.match(/<Rule\s([^>]*)>/) || [])[1] || "";
    const ruleId = attr("<Rule " + ruleOpen + ">", "id") || attr(ruleOpen, "id");
    const severity = attr(ruleOpen, "severity") || "medium";
    // Rule inner block
    const ruleBlock = (gb.match(/<Rule\s[^>]*>([\s\S]*?)<\/Rule>/) || [])[1] || gb;
    const code = decode(tag(ruleBlock, "version"));
    const title = decode(tag(ruleBlock, "title"));
    const rawDesc = decode(tag(ruleBlock, "description"));
    const rationale = subField(rawDesc, "VulnDiscussion") || rawDesc;
    const remediation = decode(tag(ruleBlock, "fixtext"));
    // Match the real <check-content> element only — not the self-closing <check-content-ref .../>.
    const audit = decode((ruleBlock.match(/<check-content>([\s\S]*?)<\/check-content>/) || [])[1] || "");
    const ccis = [];
    const cciRe = /<ident system="[^"]*cci[^"]*">([^<]+)<\/ident>/gi;
    let c;
    while ((c = cciRe.exec(ruleBlock))) ccis.push(c[1].trim());

    if (!code && !title) continue;
    controls.push({
      code: code || vulnId,
      vulnId,
      ruleId,
      title,
      severity: severity.toLowerCase(),
      cat: CAT[severity.toLowerCase()] || "CAT II",
      srg,
      rationale,
      audit,
      remediation,
      ccis,
    });
  }
  return { benchTitle, release: releaseInfo.trim(), controls };
}

// Derive a control "family" from the STIG id prefix or SRG class, for grouping in the UI.
export function familyOf(ctrl) {
  const m = (ctrl.code || "").match(/^([A-Z0-9]+-\d{2})/);
  if (m) return m[1];
  const s = (ctrl.srg || "").match(/SRG-OS-\d+/);
  return s ? s[0] : "General";
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , file, slug] = process.argv;
  if (!file || !slug) {
    console.error("Usage: node scripts/import-xccdf.mjs <xccdf.xml> <slug>");
    process.exit(1);
  }
  const xml = fs.readFileSync(file, "utf8");
  const result = parseXccdf(xml);
  const outDir = path.join(process.cwd(), "data", "stig");
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `${slug}.json`);
  fs.writeFileSync(out, JSON.stringify({ slug, ...result }, null, 1));
  const sev = result.controls.reduce((a, c) => ((a[c.cat] = (a[c.cat] || 0) + 1), a), {});
  console.log(`${slug}: ${result.controls.length} controls  ${JSON.stringify(sev)}  → ${path.relative(process.cwd(), out)}`);
  console.log(`  title: ${result.benchTitle}`);
}
