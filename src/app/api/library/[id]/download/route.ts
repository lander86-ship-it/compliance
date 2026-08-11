import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};

// Serve a stored guide (DOCX/PDF) from the DB — the buyer's own only.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const fmt = (new URL(req.url).searchParams.get("fmt") || "docx").toLowerCase();
  if (fmt !== "docx" && fmt !== "pdf") return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  const d = await prisma.generatedDoc.findUnique({ where: { id: params.id } });
  if (!d || d.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const b64 = fmt === "docx" ? d.docx : d.pdf;
  if (!b64) return NextResponse.json({ error: "This format is not stored for this guide." }, { status: 404 });
  const buf = Buffer.from(b64, "base64");
  const safe = (d.guideName || "guide").replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 60);
  return new NextResponse(new Uint8Array(buf), {
    headers: { "Content-Type": MIME[fmt], "Content-Disposition": `attachment; filename="${safe}-v${d.version}.${fmt}"`, "Cache-Control": "no-store" },
  });
}
