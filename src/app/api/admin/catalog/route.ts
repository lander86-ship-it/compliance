import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, canManageCatalog } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { mergedBundles } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// List merged bundles (admin view).
export async function GET() {
  const user = await getSessionUser().catch(() => null);
  if (!user || !canManageCatalog(user.role)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  return NextResponse.json({ bundles: await mergedBundles() });
}

const upsert = z.object({
  id: z.string().min(1).max(60).optional(), // omit to create a new custom bundle
  name: z.string().max(160).optional(),
  tagline: z.string().max(400).optional(),
  price: z.string().max(40).optional(),
  family: z.enum(["hardening", "standards"]).optional(),
  sources: z.array(z.enum(["cis", "disa"])).optional(),
  categories: z.array(z.string().max(60)).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
});

// Create or update a bundle override (or a new custom bundle when id is omitted).
export async function POST(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user || !canManageCatalog(user.role)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const parsed = upsert.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const v = parsed.data;

  const isNew = !v.id;
  const id = v.id || `pk-custom-${Date.now().toString(36)}`;
  const data = {
    name: v.name ?? null,
    tagline: v.tagline ?? null,
    price: v.price ?? null,
    family: v.family ?? null,
    sourcesCsv: v.sources ? v.sources.join(",") : null,
    categoriesCsv: v.categories ? v.categories.join(",") : null,
    featured: v.featured ?? null,
    active: v.active ?? true,
  };
  await prisma.bundleOverride.upsert({
    where: { id },
    create: { id, ...data, custom: isNew },
    update: data,
  });
  return NextResponse.json({ ok: true, id });
}

// Delete: for a custom bundle removes it; for a static bundle marks it inactive.
export async function DELETE(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user || !canManageCatalog(user.role)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const existing = await prisma.bundleOverride.findUnique({ where: { id } });
  if (existing?.custom) await prisma.bundleOverride.delete({ where: { id } }).catch(() => {});
  else await prisma.bundleOverride.upsert({ where: { id }, create: { id, active: false }, update: { active: false } });
  return NextResponse.json({ ok: true });
}
