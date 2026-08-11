import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The buyer's stored guides (metadata + lifecycle; bytes fetched via /download).
export async function GET() {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ docs: [] }, { status: 401 });
  const rows = await prisma.generatedDoc.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }).catch(() => []);
  return NextResponse.json({
    docs: rows.map((d) => ({
      id: d.id,
      source: d.source,
      guideName: d.guideName,
      legal: d.legal,
      version: d.version,
      createdAt: d.createdAt.toISOString(),
      reviewedAt: d.reviewedAt ? d.reviewedAt.toISOString() : null,
      nextReviewAt: d.nextReviewAt ? d.nextReviewAt.toISOString() : null,
      hasDocx: !!d.docx,
      hasPdf: !!d.pdf,
    })),
  });
}
