// Node wrapper around the `cis-bench` CLI — the same tool the /cis service uses to
// connect to CIS WorkBench (list / search / export benchmarks as XCCDF). Ported from
// /cis app/cis.py: every call uses an explicit argv array (never a shell string), so
// user input cannot inject commands. Degrades gracefully when the CLI or an
// authenticated CIS WorkBench session is not available.

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { workbenchLogin } from "./workbenchLogin";

const CIS_BIN = process.env.CIS_BENCH_BIN || "cis-bench";
const WORK_DIR = process.env.CIS_WORK_DIR || path.join(os.tmpdir(), "cis-work");
const DEFAULT_TIMEOUT = Number(process.env.CIS_BENCH_TIMEOUT || "600") * 1000;

const VALID_FORMATS = new Set(["yaml", "csv", "json", "markdown", "xccdf"]);
const VALID_STYLES = new Set(["cis", "disa", "stig"]);

export type CisResult = {
  ok: boolean;
  code: number;
  stdout: string;
  stderr: string;
  command: string;
};

// Run `cis-bench <args>` safely (argv array, no shell), capturing output.
export function run(args: string[], timeout = DEFAULT_TIMEOUT): Promise<CisResult> {
  const command = [CIS_BIN, ...args].join(" ");
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(CIS_BIN, args, { cwd: WORK_DIR, env: process.env });
    } catch {
      resolve({ ok: false, code: 127, stdout: "", stderr: `'${CIS_BIN}' not found. Is cis-bench installed and on PATH?`, command });
      return;
    }
    let stdout = "";
    let stderr = "";
    let done = false;
    const finish = (r: CisResult) => { if (!done) { done = true; resolve(r); } };
    const timer = setTimeout(() => { try { child.kill("SIGKILL"); } catch { /* noop */ } finish({ ok: false, code: 124, stdout, stderr: `Command timed out after ${timeout / 1000}s.`, command }); }, timeout);
    child.stdout?.on("data", (d) => (stdout += d.toString()));
    child.stderr?.on("data", (d) => (stderr += d.toString()));
    child.on("error", (e: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      const msg = e.code === "ENOENT" ? `'${CIS_BIN}' not found. Is cis-bench installed and on PATH?` : String(e.message || e);
      finish({ ok: false, code: 127, stdout, stderr: msg, command });
    });
    child.on("close", (code) => { clearTimeout(timer); finish({ ok: code === 0, code: code ?? 1, stdout, stderr, command }); });
  });
}

async function ensureWorkDir(): Promise<void> {
  await fs.mkdir(WORK_DIR, { recursive: true }).catch(() => {});
}

// Is the cis-bench executable reachable? Best-effort (runs `--version`).
export async function cliAvailable(): Promise<boolean> {
  const res = await run(["--version"], 30_000);
  return res.ok || res.code !== 127;
}

// Authenticated CIS WorkBench session? Mirrors `cis-bench auth status`.
export async function authStatus(): Promise<CisResult> {
  return run(["auth", "status"], 60_000);
}

// Load a Netscape cookies.txt (e.g. decoded from CIS_COOKIES_B64) into cis-bench.
export async function loginWithCookies(cookiesTxt: string): Promise<CisResult> {
  await ensureWorkDir();
  const dest = path.join(WORK_DIR, "cookies.txt");
  await fs.writeFile(dest, cookiesTxt);
  try {
    return await run(["auth", "login", "--cookies", dest], 120_000);
  } finally {
    await fs.unlink(dest).catch(() => {});
  }
}

// Bootstrap auth from the CIS_COOKIES_B64 env secret (like /cis). Non-fatal.
export async function bootstrapAuth(): Promise<boolean> {
  const blob = process.env.CIS_COOKIES_B64;
  if (!blob) return false;
  try {
    const res = await loginWithCookies(Buffer.from(blob, "base64").toString("utf8"));
    return res.ok;
  } catch {
    return false;
  }
}

let _authed = false;

// Ensure cis-bench has an authenticated CIS WorkBench session. Tries, in order:
// an existing session, CIS_COOKIES_B64, then CIS_WORKBENCH_USERNAME/PASSWORD form login.
export async function ensureAuth(): Promise<{ ok: boolean; detail: string }> {
  if (_authed) return { ok: true, detail: "Authenticated to CIS WorkBench." };
  if (!(await cliAvailable())) return { ok: false, detail: "cis-bench CLI not installed in this runtime." };

  const status = await authStatus();
  if (status.ok) { _authed = true; return { ok: true, detail: "Authenticated to CIS WorkBench." }; }

  if (process.env.CIS_COOKIES_B64) {
    try {
      const r = await loginWithCookies(Buffer.from(process.env.CIS_COOKIES_B64, "base64").toString("utf8"));
      if (r.ok) { _authed = true; return { ok: true, detail: "Authenticated to CIS WorkBench (cookies)." }; }
    } catch { /* fall through */ }
  }

  const u = process.env.CIS_WORKBENCH_USERNAME;
  const p = process.env.CIS_WORKBENCH_PASSWORD;
  if (u && p) {
    const login = await workbenchLogin(u, p);
    if (!login.cookiesTxt) return { ok: false, detail: login.error };
    const r = await loginWithCookies(login.cookiesTxt);
    if (r.ok) { _authed = true; return { ok: true, detail: "Authenticated to CIS WorkBench." }; }
    return { ok: false, detail: (r.stderr || "cis-bench rejected the session").slice(0, 200) };
  }

  return { ok: false, detail: "Connect your CIS WorkBench (set CIS_WORKBENCH_USERNAME/PASSWORD or CIS_COOKIES_B64)." };
}

// Search the CIS catalog. IMPORTANT: cis-bench's top-level `list` shows only
// *downloaded* benchmarks — the browsable catalog (1400+ benchmarks) is reached
// via `search <query>` / `catalog search`, both of which support JSON output.
export async function search(query: string): Promise<CisResult> {
  const base = query ? ["search", query] : ["catalog", "search", "--latest"];
  const res = await run([...base, "--output-format", "json"], 120_000);
  return res.ok ? res : run(base, 120_000);
}

// Full catalog (latest versions) as JSON — used when browsing without a query.
export async function listCatalog(): Promise<CisResult> {
  return run(["catalog", "search", "--latest", "--output-format", "json"], 120_000);
}

export async function catalogRefresh(): Promise<CisResult> {
  return run(["catalog", "refresh"]);
}

function parseList(stdout: string): Record<string, unknown>[] {
  try {
    const data = JSON.parse(stdout);
    if (Array.isArray(data)) return data.filter((x) => x && typeof x === "object");
    if (data && typeof data === "object") {
      for (const k of ["benchmarks", "results", "items", "data", "catalog", "records"]) {
        const v = (data as Record<string, unknown>)[k];
        if (Array.isArray(v)) return v.filter((x) => x && typeof x === "object");
      }
      for (const v of Object.values(data)) if (Array.isArray(v) && v.length && typeof v[0] === "object") return v as Record<string, unknown>[];
    }
  } catch { /* not json */ }
  return [];
}

let _catalogRefreshed = false;

// Ensure the local catalog is populated (scrape once if empty). cis-bench needs
// `catalog refresh` before any search OR export works — export loads benchmarks
// "from database" (catalog.db), which does not exist until the first refresh.
// On hosts without a persistent volume (catalog.db is ephemeral) this rebuilds
// the catalog after each cold start.
export async function ensureCatalog(): Promise<void> {
  if (_catalogRefreshed) return;
  const probe = parseList((await listCatalog()).stdout);
  if (!probe.length) await catalogRefresh();
  _catalogRefreshed = true;
}

// Search the catalog, returning matching benchmarks as parsed objects. Empty
// query returns the full latest-version catalog. Refreshes once if needed.
export async function searchCatalog(query: string): Promise<Record<string, unknown>[]> {
  await ensureCatalog();
  return parseList((await search(query)).stdout);
}

// Return the full benchmark catalog as parsed objects (latest versions).
export async function getCatalogItems(): Promise<Record<string, unknown>[]> {
  return searchCatalog("");
}

// Raw search output (for diagnostics only).
export async function rawList(): Promise<string> {
  await ensureCatalog();
  return (await listCatalog()).stdout.slice(0, 4000);
}

// Export a benchmark by numeric id (export) or text query (get) into WORK_DIR,
// returning the raw bytes. `style` only applies to XCCDF (cis|disa|stig).
export async function exportBytes(identifier: string, fmt = "xccdf", style?: string): Promise<{ res: CisResult; data: Buffer | null }> {
  fmt = fmt.toLowerCase().trim();
  if (!VALID_FORMATS.has(fmt)) return { res: { ok: false, code: 2, stdout: "", stderr: `Unsupported format: ${fmt}`, command: "" }, data: null };
  // export/get read from catalog.db ("Loading benchmark … from database"), which
  // only exists after a catalog refresh — build it first if needed.
  await ensureCatalog();
  await ensureWorkDir();
  const ext = ({ yaml: "yaml", csv: "csv", json: "json", markdown: "md", xccdf: "xml" } as Record<string, string>)[fmt];
  const safe = identifier.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 40).replace(/^_+|_+$/g, "") || "benchmark";
  const outName = `.src-${safe}.${ext}`;
  const outPath = path.join(WORK_DIR, outName);
  const isId = /^\d+$/.test(identifier.trim());
  if (isId) await run(["download", identifier.trim()]).catch(() => {});
  const args = [isId ? "export" : "get", identifier.trim(), "--format", fmt, "-o", outPath];
  if (fmt === "xccdf" && style && VALID_STYLES.has(style)) args.push("--style", style);
  const res = await run(args);
  try {
    const data = await fs.readFile(outPath);
    await fs.unlink(outPath).catch(() => {});
    return { res, data };
  } catch {
    return { res, data: null };
  }
}
