// Server-side guest-trial guard. Enforces "one free generation" per visitor using an
// httpOnly cookie AND an in-memory per-IP window, so clearing browser storage/cookies
// doesn't grant a second trial from the same network. Best-effort (single instance);
// resets on redeploy. Signed-in users are never limited.

export const TRIAL_COOKIE = "hh_trial";
export const TRIAL_WINDOW_MS = 24 * 60 * 60 * 1000; // ~one session/day

const usedIps = new Map<string, number>(); // ip -> expiry ts

let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [ip, exp] of usedIps) if (exp <= now) usedIps.delete(ip);
}

// Has this visitor already used their trial (by cookie or by IP)?
export function trialUsed(ip: string, cookiePresent: boolean): boolean {
  const now = Date.now();
  sweep(now);
  if (cookiePresent) return true;
  const exp = usedIps.get(ip);
  return !!exp && exp > now;
}

// Mark the trial as used for this IP (the cookie is set by the route on the response).
export function markTrialUsed(ip: string): void {
  usedIps.set(ip, Date.now() + TRIAL_WINDOW_MS);
}
