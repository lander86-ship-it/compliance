import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, canManageCatalog } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Import a ready-made master document (SecureHub library DOCX) as a catalog Standard.
// Auth: an admin session, or the IMPORT_TOKEN header (for bulk-loading the library).
const schema = z.object({
  docId: z.string().max(40).optional(), // e.g. SH-POL-001 — kept in the summary metadata
  title: z.string().min(1).max(200),
  platform: z.string().max(80).optional(),
  summary: z.string().max(400).optional(),
  docxBase64: z.string().min(100).max(40_000_000),
  bundleId: z.string().max(60).nullable().optional(),
  priceCents: z.number().int().min(0).nullable().optional(),
  publish: z.boolean().default(true),
  hidden: z.boolean().default(false),
  // Optionally ensure the catalog bundle the standards are sold under exists (custom bundle).
  ensureBundle: z
    .object({
      id: z.string().min(1).max(60),
      name: z.string().min(1).max(120),
      tagline: z.string().max(300).default(""),
      price: z.string().max(20).default("$0"),
      family: z.string().max(30).default("standards"),
      featured: z.boolean().default(false),
    })
    .optional(),
});

async function authorized(req: Request): Promise<boolean> {
  const token = process.env.IMPORT_TOKEN;
  if (token && req.headers.get("x-import-token") === token) return true;
  const user = await getSessionUser().catch(() => null);
  return !!user && canManageCatalog(user.role);
}

export async function POST(req: Request) {
  if (!(await authorized(req))) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  const v = parsed.data;

  try {
    if (v.ensureBundle) {
      const b = v.ensureBundle;
      await prisma.bundleOverride.upsert({
        where: { id: b.id },
        create: { id: b.id, custom: true, active: true, name: b.name, tagline: b.tagline, price: b.price, family: b.family, featured: b.featured },
        update: { active: true, name: b.name, tagline: b.tagline, price: b.price, family: b.family, featured: b.featured },
      });
    }

    // Minimal structured content for back-compat consumers; the master DOCX is authoritative.
    const contentJson = JSON.stringify({
      narrative: { purposeIntro: v.summary || "" },
      sections: [],
      summary: v.summary || "",
      platform: v.platform || "Corporate Policy",
      master: v.docId || null,
    });

    // Idempotent by title: re-importing updates the existing row instead of duplicating.
    const existing = await prisma.standard.findFirst({ where: { title: v.title } });
    const data = {
      title: v.title,
      sourceUrl: null,
      platform: v.platform || "Corporate Policy",
      summary: v.summary || null,
      contentJson,
      masterDocx: v.docxBase64,
      status: v.publish ? "published" : "draft",
      hidden: v.hidden,
      bundleId: v.bundleId ?? null,
      priceCents: v.priceCents ?? null,
      updatedAt: new Date(),
    };
    const std = existing
      ? await prisma.standard.update({ where: { id: existing.id }, data })
      : await prisma.standard.create({ data });
    return NextResponse.json({ ok: true, id: std.id, title: std.title, updated: !!existing });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Import failed" }, { status: 500 });
  }
}
