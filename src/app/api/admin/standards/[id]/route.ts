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

const roleSchema = z.object({ role: z.string().max(120), responsibilities: z.array(z.string().max(600)).max(30) });
const contentSchema = z.object({
  purposeIntro: z.string().max(4000).optional(),
  purposeAims: z.array(z.string().max(600)).max(40).optional(),
  scopeIntro: z.string().max(4000).optional(),
  scopeCovers: z.array(z.string().max(600)).max(40).optional(),
  roles: z.array(roleSchema).max(20).optional(),
  complianceIntro: z.string().max(4000).optional(),
  complianceEnforcement: z.string().max(4000).optional(),
  sections: z.array(z.string().max(1000)).max(400).optional(),
});

const patch = z.object({
  title: z.string().max(200).optional(),
  summary: z.string().max(400).nullable().optional(),
  publish: z.boolean().optional(),
  hidden: z.boolean().optional(),
  bundleId: z.string().max(60).nullable().optional(),
  priceCents: z.number().int().min(0).nullable().optional(),
  content: contentSchema.optional(),
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
  if (v.summary !== undefined) data.summary = v.summary;
  if (v.publish === true) { data.status = "published"; data.hidden = true; } // published but hidden until surfaced
  if (typeof v.hidden === "boolean") data.hidden = v.hidden;
  if (v.bundleId !== undefined) data.bundleId = v.bundleId;
  if (v.priceCents !== undefined) data.priceCents = v.priceCents;

  // Edit the drafted body: merge the provided narrative/section fields into stored content.
  if (v.content) {
    const existing = await prisma.standard.findUnique({ where: { id: params.id } }).catch(() => null);
    if (existing) {
      const c = parseContent(existing.contentJson);
      const cn = v.content;
      const n = { ...c.narrative };
      if (cn.purposeIntro !== undefined) n.purposeIntro = cn.purposeIntro;
      if (cn.purposeAims !== undefined) n.purposeAims = cn.purposeAims;
      if (cn.scopeIntro !== undefined) n.scopeIntro = cn.scopeIntro;
      if (cn.scopeCovers !== undefined) n.scopeCovers = cn.scopeCovers;
      if (cn.roles !== undefined) n.roles = cn.roles;
      if (cn.complianceIntro !== undefined) n.complianceIntro = cn.complianceIntro;
      if (cn.complianceEnforcement !== undefined) n.complianceEnforcement = cn.complianceEnforcement;
      const merged = { ...c, narrative: n, sections: cn.sections !== undefined ? cn.sections : c.sections };
      data.contentJson = JSON.stringify(merged);
    }
  }

  await prisma.standard.update({ where: { id: params.id }, data }).catch(() => {});
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser().catch(() => null);
  if (!user || !canManageCatalog(user.role)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await prisma.standard.delete({ where: { id: params.id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
