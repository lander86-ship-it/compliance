import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Re-sign a policy as reviewed: stamps the review date and pushes the next
// review reminder out one year.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const d = await prisma.generatedDoc.findUnique({ where: { id: params.id } });
  if (!d || d.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const now = new Date();
  await prisma.generatedDoc.update({ where: { id: d.id }, data: { reviewedAt: now, nextReviewAt: new Date(now.getTime() + 365 * 24 * 3600 * 1000) } });
  return NextResponse.json({ ok: true });
}
