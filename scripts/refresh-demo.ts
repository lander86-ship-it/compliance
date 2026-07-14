// Regenerate the standalone demo's data blocks from the app catalog and splice them into
// demo/hardenhub-preview.html. Run: npx tsx scripts/refresh-demo.ts
import fs from "fs";
import { PRODUCTS, BUNDLES, DIRECTORY } from "../src/lib/hub/data";

const P = "var PRODUCTS=[\n" + PRODUCTS.map((p) => JSON.stringify(p)).join(",\n") + "\n];";
const B = "var BUNDLES=[\n" + BUNDLES.map((b) => { const { framework, ...rest } = b as Record<string, unknown>; void framework; return JSON.stringify(rest); }).join(",\n") + "\n];";
const D = "var DIRECTORY=" + JSON.stringify(DIRECTORY) + ";";
const lib = PRODUCTS.filter((p) => p.framework === "DISA STIG").map((p) => ({
  name: p.name, version: `${p.version} · ${p.controls} controls`, fw: "STIG",
  status: "Ready to scope", sc: "#1f7a4d", gens: "0 of 5 generations used", artifacts: [] as string[], pid: p.id,
}));
const L = "var LIBRARY_ITEMS=[\n" + lib.map((x) => JSON.stringify(x)).join(",\n") + "\n];";

const file = "demo/hardenhub-preview.html";
const jobs: [string, RegExp, string][] = [
  ["PRODUCTS", /var PRODUCTS=\[[\s\S]*?\n\];/, P],
  ["BUNDLES", /var BUNDLES=\[[\s\S]*?\n\];/, B],
  ["DIRECTORY", /var DIRECTORY=\{.*?\};/, D], // single-line JSON — do NOT use a multiline regex here
  ["LIBRARY_ITEMS", /var LIBRARY_ITEMS=\[[\s\S]*?\n\];/, L],
];
for (const [name, re, repl] of jobs) {
  const html = fs.readFileSync(file, "utf8");
  if (!re.test(html)) throw new Error(`refresh-demo: no match for ${name}`);
  fs.writeFileSync(file, html.replace(re, () => repl));
}
console.log(`refresh-demo: ${PRODUCTS.length} products, ${BUNDLES.length} bundles, ${lib.length} library items`);
