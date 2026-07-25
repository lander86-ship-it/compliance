import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword, makeToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const email = parsed.data.email.toLowerCase().trim();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    cookies().set(SESSION_COOKIE, makeToken(user.id), sessionCookieOptions);
    return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Login failed" }, { status: 500 });
  }
}
