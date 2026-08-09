import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The buyer's saved default house-style template (uploaded once, reused for
// every generation). GET returns metadata only; POST saves; DELETE removes.
export async function GET() {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ template: null }, { status: 401 });
  const t = await prisma.userTemplate.findUnique({ where: { userId: user.id } }).catch(() => null);
  return NextResponse.json({ template: t ? { name: t.name, type: t.type, updatedAt: t.updatedAt.toISOString() } : null });
}

const schema = z.object({
  base64: z.string().min(1).max(20_000_000),
  type: z.enum(["docx", "pdf"]),
  name: z.string().max(200).default("template"),
});

export async function POST(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid template" }, { status: 400 });
  const { base64, type, name } = parsed.data;
  await prisma.userTemplate.upsert({
    where: { userId: user.id },
    create: { userId: user.id, name, type, data: base64 },
    update: { name, type, data: base64 },
  });
  return NextResponse.json({ ok: true, template: { name, type } });
}

export async function DELETE() {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  await prisma.userTemplate.delete({ where: { userId: user.id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
