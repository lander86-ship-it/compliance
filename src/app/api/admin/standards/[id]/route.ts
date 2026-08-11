import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, canManageCatalog } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseContent } from "@/lib/standardDoc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Full standard incl. rendered content (admin review).
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser().catch(() => null);
  if (!user || !canManageCatalog(user.role)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const s = await prisma.standard.findUnique({ where: { id: params.id } });
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ standard: { id: s.id, title: s.title, sourceUrl: s.sourceUrl, platform: s.platform, status: s.status, hidden: s.hidden, bundleId: s.bundleId, priceCents: s.priceCents, createdAt: s.createdAt.toISOString(), content: parseContent(s.contentJson) } });
}

const patch = z.object({
  title: z.string().max(200).optional(),
  publish: z.boolean().optional(),
  hidden: z.boolean().optional(),
  bundleId: z.string().max(60).nullable().optional(),
  priceCents: z.number().int().min(0).nullable().optional(),
});

// Update: rename, publish, hide/show, assign bundle + price.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser().catch(() => null);
  if (!user || !canManageCatalog(user.role)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const parsed = patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const v = parsed.data;
  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof v.title === "string") data.title = v.title;
  if (v.publish === true) { data.status = "published"; data.hidden = true; } // published but hidden until surfaced
  if (typeof v.hidden === "boolean") data.hidden = v.hidden;
  if (v.bundleId !== undefined) data.bundleId = v.bundleId;
  if (v.priceCents !== undefined) data.priceCents = v.priceCents;
  await prisma.standard.update({ where: { id: params.id }, data }).catch(() => {});
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser().catch(() => null);
  if (!user || !canManageCatalog(user.role)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await prisma.standard.delete({ where: { id: params.id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
