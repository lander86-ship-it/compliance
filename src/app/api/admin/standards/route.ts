import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, canManageCatalog } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { draftStandardFromUrl } from "@/lib/standardDraft";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// List all AI-drafted standards (admin).
export async function GET() {
  const user = await getSessionUser().catch(() => null);
  if (!user || !canManageCatalog(user.role)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const rows = await prisma.standard.findMany({ orderBy: { createdAt: "desc" }, take: 200 }).catch(() => []);
  return NextResponse.json({
    standards: rows.map((s) => ({ id: s.id, title: s.title, sourceUrl: s.sourceUrl, platform: s.platform, summary: s.summary, status: s.status, hidden: s.hidden, bundleId: s.bundleId, priceCents: s.priceCents, createdAt: s.createdAt.toISOString() })),
  });
}

const schema = z.object({ url: z.string().url() });

// Generate a new standard from a source URL (Claude drafts it) and store as draft.
export async function POST(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user || !canManageCatalog(user.role)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid URL." }, { status: 400 });
  let draft;
  try {
    draft = await draftStandardFromUrl(parsed.data.url);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Generation failed" }, { status: 502 });
  }
  const std = await prisma.standard.create({
    data: {
      title: draft.title,
      sourceUrl: parsed.data.url,
      platform: draft.platform,
      summary: draft.content.narrative.purposeIntro?.slice(0, 300) || null,
      contentJson: JSON.stringify(draft.content),
      status: "draft",
      hidden: true,
    },
  });
  return NextResponse.json({ ok: true, id: std.id, aiUsed: draft.aiUsed, title: std.title });
}
