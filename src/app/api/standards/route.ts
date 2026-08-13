import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { entitlementsFor, entitlementsForRole, ownsStandard } from "@/lib/entitlements";
import { mergedBundles } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public catalog of published, surfaced standards for the storefront (Frameworks).
// Marks each with `owned` so the client sees Buy vs. Generate.
export async function GET() {
  const rows = await prisma.standard
    .findMany({ where: { status: "published", hidden: false }, orderBy: { createdAt: "desc" }, take: 200 })
    .catch(() => []);
  const user = await getSessionUser().catch(() => null);
  const ent = user ? entitlementsForRole(user.role) || (await entitlementsFor(user.id)) : null;
  const bundles = await mergedBundles();
  const byId = new Map(bundles.map((b) => [b.id, b]));
  return NextResponse.json({
    standards: rows.map((s) => {
      const b = s.bundleId ? byId.get(s.bundleId) : undefined;
      return {
        id: s.id,
        title: s.title,
        platform: s.platform,
        summary: s.summary,
        sourceUrl: s.sourceUrl,
        bundleId: s.bundleId,
        bundleName: b?.name || null,
        bundlePrice: b?.price || null,
        priceCents: s.priceCents,
        owned: ent ? ownsStandard(ent, s.bundleId) : false,
      };
    }),
  });
}
