// Resolve the newest API-served version of a STIG title: tries each version (newest first)
// against the trackr summary endpoint and prints "<version> <release>" for the first that works.
import fs from "fs";
const [, , title] = process.argv;
const d = JSON.parse(fs.readFileSync("scratchpad/stiglist.json", "utf8"));
const arr = (d[title] || []).slice().sort((a, b) => (+b.version * 100 + +b.release) - (+a.version * 100 + +a.release));
async function ok(v, r) {
  try {
    const res = await fetch(`https://cyber.trackr.live/api/stig/${title}/${v}/${r}`, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return false;
    const j = await res.json();
    return j && j.requirements && Object.keys(j.requirements).length > 0;
  } catch {
    return false;
  }
}
for (const e of arr) {
  if (await ok(e.version, e.release)) {
    process.stdout.write(`${e.version} ${e.release}`);
    process.exit(0);
  }
}
process.exit(1);
