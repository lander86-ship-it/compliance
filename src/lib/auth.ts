import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const COOKIE = "cf_session";
const SECRET = process.env.SESSION_SECRET || "dev-only-change-me";

// ── password hashing ──
export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

// ── signed session token (userId.signature) ──
function sign(value: string): string {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}
export function makeToken(userId: string): string {
  return `${userId}.${sign(userId)}`;
}
function verifyToken(token: string): string | null {
  const [userId, sig] = token.split(".");
  if (!userId || !sig) return null;
  const expected = sign(userId);
  // constant-time comparison
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return userId;
}

export const SESSION_COOKIE = COOKIE;
// 10-minute sliding session: the cookie expires 10 min after the last activity.
// Each authenticated request re-issues the cookie (see refreshSession), so an
// active user stays logged in and 10 min of inactivity ends the session.
export const SESSION_TTL_SECONDS = 60 * 10;
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_TTL_SECONDS,
};

// Re-issue the session cookie to slide its 10-minute expiry forward. Call from a
// route handler on each authenticated request.
export function refreshSession(res: { cookies: { set: (name: string, value: string, opts: typeof sessionCookieOptions) => void } }, userId: string): void {
  res.cookies.set(COOKIE, makeToken(userId), sessionCookieOptions);
}

export type SessionUser = {
  id: string;
  email: string;
  role: string;
  name: string | null;
  orgId: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const userId = verifyToken(token);
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return { id: user.id, email: user.email, role: user.role, name: user.name, orgId: user.orgId };
}

const BACK_OFFICE_ROLES = new Set(["author", "admin", "owner"]);
export function isBackOffice(role: string | undefined | null): boolean {
  return !!role && BACK_OFFICE_ROLES.has(role);
}
export function canManageCatalog(role: string | undefined | null): boolean {
  return role === "admin" || role === "owner";
}
