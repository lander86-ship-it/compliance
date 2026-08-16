import { NextResponse } from "next/server";
import { getSessionUser, canManageCatalog } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseContent, buildStandardDocx, buildStandardPdf } from "@/lib/standardDoc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};

// Download a standard as DOCX or PDF.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser().catch(() => null);
  if (!user || !canManageCatalog(user.role)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const fmt = (new URL(req.url).searchParams.get("fmt") || "docx").toLowerCase();
  if (fmt !== "docx" && fmt !== "pdf") return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  const s = await prisma.standard.findUnique({ where: { id: params.id } });
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Ready-made master documents are served as-is (DOCX is the authoritative artifact).
  if (s.masterDocx) {
    if (fmt !== "docx") return NextResponse.json({ error: "This library document is delivered as DOCX." }, { status: 400 });
    const safeM = s.title.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 60) || "standard";
    return new NextResponse(new Uint8Array(Buffer.from(s.masterDocx, "base64")), {
      headers: { "Content-Type": MIME.docx, "Content-Disposition": `attachment; filename="${safeM}.docx"`, "Cache-Control": "no-store" },
    });
  }
  const content = parseContent(s.contentJson);
  const buf = fmt === "docx" ? await buildStandardDocx(s.title, content) : await buildStandardPdf(s.title, content);
  const safe = s.title.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 60) || "standard";
  return new NextResponse(new Uint8Array(buf), {
    headers: { "Content-Type": MIME[fmt], "Content-Disposition": `attachment; filename="${safe}.${fmt}"`, "Cache-Control": "no-store" },
  });
}
