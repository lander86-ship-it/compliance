import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The signed-in buyer's generated guides (Library view).
export async function GET() {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ generations: [] }, { status: 401 });
  const rows = await prisma.generationEvent
    .findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 })
    .catch(() => []);
  return NextResponse.json({
    generations: rows.map((g) => ({
      id: g.id,
      source: g.source,
      guideName: g.guideName,
      guideRef: g.guideRef,
      formats: (g.formats || "").split(",").filter(Boolean),
      createdAt: g.createdAt.toISOString(),
    })),
  });
}
