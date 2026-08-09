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
  const EXT: Record<string, string> = { DOCX: "docx", PDF: "pdf", XLSX: "xlsx", POLICY: "docx" };
  return NextResponse.json({
    generations: rows.map((g) => {
      const files = (g.artifacts || "").split(",").filter(Boolean);
      const formats = (g.formats || "").split(",").filter(Boolean);
      // Pair each format with its stored filename (download URL) when available.
      const downloads = formats.map((fmt, i) => {
        const file = files[i] || files.find((f) => f.toLowerCase().endsWith("." + (EXT[fmt] || "")));
        return { format: fmt, url: file ? `/api/artifact/${file}` : null };
      });
      return {
        id: g.id,
        source: g.source,
        guideName: g.guideName,
        guideRef: g.guideRef,
        formats,
        downloads,
        createdAt: g.createdAt.toISOString(),
      };
    }),
  });
}
