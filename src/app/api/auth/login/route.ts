import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword, makeToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

function tooMany(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many attempts. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const email = parsed.data.email.toLowerCase().trim();

  // Brute-force protection: cap attempts per IP and per targeted account.
  const ip = clientIp(req);
  const ipLimit = rateLimit(`login:ip:${ip}`, 20, 5 * 60_000);
  if (!ipLimit.ok) return tooMany(ipLimit.retryAfter);
  const emailLimit = rateLimit(`login:email:${email}`, 8, 15 * 60_000);
  if (!emailLimit.ok) return tooMany(emailLimit.retryAfter);

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    const { consumeInvites } = await import("@/lib/org");
    await consumeInvites(user.id, user.email);
    cookies().set(SESSION_COOKIE, makeToken(user.id), sessionCookieOptions);
    return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Login failed" }, { status: 500 });
  }
}
