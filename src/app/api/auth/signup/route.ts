import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, makeToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";

// Emails listed here (comma-separated) are provisioned as owners (the admin/you).
const OWNERS = (process.env.OWNER_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const email = parsed.data.email.toLowerCase().trim();
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    const role = OWNERS.includes(email) ? "owner" : "customer";
    const user = await prisma.user.create({
      data: { email, passwordHash: await hashPassword(parsed.data.password), name: parsed.data.name || null, role },
    });
    cookies().set(SESSION_COOKIE, makeToken(user.id), sessionCookieOptions);
    return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Signup failed" }, { status: 500 });
  }
}
