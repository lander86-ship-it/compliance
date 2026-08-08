// Log in to CIS WorkBench with username/email + password and return the session as a
// Netscape cookies.txt string (which cis-bench consumes via `auth login --cookies`).
// Ported from the /cis service's app/workbench_login.py. cis-bench itself only supports
// cookie auth; WorkBench is a Laravel app whose /login form POSTs _token (CSRF) + login
// + password. Best-effort: 2FA/SSO accounts must use the CIS_COOKIES_B64 path instead.

const BASE = "https://workbench.cisecurity.org";
const LOGIN_URL = `${BASE}/login`;
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function parseSetCookies(res: Response, jar: Map<string, string>): void {
  // Node 18.14+/20 exposes getSetCookie(); fall back to the single header.
  const list: string[] = typeof (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === "function"
    ? (res.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
    : (res.headers.get("set-cookie") ? [res.headers.get("set-cookie") as string] : []);
  for (const sc of list) {
    const first = sc.split(";")[0];
    const eq = first.indexOf("=");
    if (eq > 0) jar.set(first.slice(0, eq).trim(), first.slice(eq + 1).trim());
  }
}

function cookieHeader(jar: Map<string, string>): string {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function toNetscape(jar: Map<string, string>): string {
  const farFuture = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;
  const lines = ["# Netscape HTTP Cookie File"];
  for (const [name, value] of jar) {
    lines.push([".cisecurity.org", "TRUE", "/", "TRUE", String(farFuture), name, value].join("\t"));
  }
  return lines.join("\n") + "\n";
}

export type LoginResult = { cookiesTxt: string | null; error: string };

export async function workbenchLogin(username: string, password: string, timeoutMs = 30000): Promise<LoginResult> {
  const jar = new Map<string, string>();
  const signal = AbortSignal.timeout(timeoutMs);
  let html: string;
  try {
    const r = await fetch(LOGIN_URL, { headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" }, signal });
    parseSetCookies(r, jar);
    html = await r.text();
  } catch (e) {
    return { cookiesTxt: null, error: `Could not reach CIS WorkBench: ${e instanceof Error ? e.message : e}` };
  }

  const token =
    html.match(/name="_token"\s+value="([^"]+)"/)?.[1] ||
    html.match(/name="csrf-token"\s+content="([^"]+)"/)?.[1] ||
    "";
  if (!token) return { cookiesTxt: null, error: "Could not find the login CSRF token (form may have changed)." };

  try {
    const body = new URLSearchParams({ _token: token, login: username, password, remember: "on" });
    // Manual redirect so we capture the session cookie set on the 302 response.
    const resp = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded", Referer: LOGIN_URL, Origin: BASE, Cookie: cookieHeader(jar) },
      body,
      redirect: "manual",
      signal,
    });
    parseSetCookies(resp, jar);

    // A 3xx to a non-login page means success; a 200 with the form means failure.
    const location = resp.headers.get("location") || "";
    const redirectedAway = resp.status >= 300 && resp.status < 400 && !/\/login\b/.test(location);
    const hasSession = [...jar.keys()].some((k) => /session/i.test(k));

    if (!redirectedAway && !hasSession) {
      const text = resp.status === 200 ? await resp.text() : "";
      const stillLogin = /name="password"/.test(text) && /name="login"/.test(text);
      if (stillLogin || !hasSession) {
        return { cookiesTxt: null, error: "Login failed — check the username/password. If the account uses 2FA or SSO, use the cookies.txt (CIS_COOKIES_B64) option instead." };
      }
    }
    return { cookiesTxt: toNetscape(jar), error: "" };
  } catch (e) {
    return { cookiesTxt: null, error: `Login request failed: ${e instanceof Error ? e.message : e}` };
  }
}
