import { NextResponse } from "next/server";
import { getSessionUser, isBackOffice } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { bundleMapById } from "@/lib/catalog";
import { priceNum } from "@/lib/hub/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;
// Percentage change vs the previous period; null when there's no baseline.
function delta(cur: number, prev: number): number | null {
  if (prev <= 0) return cur > 0 ? 100 : null;
  return Math.round(((cur - prev) / prev) * 100);
}

// Real analytics for the admin dashboard, aggregated from Purchase / GenerationEvent / User.
export async function GET() {
  const user = await getSessionUser().catch(() => null);
  if (!user || !isBackOffice(user.role)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const now = Date.now();
  const d30 = new Date(now - 30 * DAY);
  const d60 = new Date(now - 60 * DAY);

  const [purchases, activeSubs, users, newUsers30, generations, gens30, genRows] = await Promise.all([
    prisma.purchase.findMany({ select: { amountCents: true, currency: true, status: true, method: true, bundleIds: true, createdAt: true } }).catch(() => []),
    prisma.entitlement.count().catch(() => 0),
    prisma.user.count().catch(() => 0),
    prisma.user.count({ where: { createdAt: { gte: d30 } } }).catch(() => 0),
    prisma.generationEvent.count().catch(() => 0),
    prisma.generationEvent.count({ where: { createdAt: { gte: d30 } } }).catch(() => 0),
    prisma.generationEvent.findMany({ select: { source: true } }).catch(() => []),
  ]);

  // Real revenue = paid orders through a real payment method; demo/stub don't count.
  const paid = purchases.filter((p) => p.status === "paid" && (p.method === "stripe" || p.method === "po"));
  const revenueCents = paid.reduce((s, p) => s + p.amountCents, 0);
  const currency = paid[0]?.currency || "USD";

  const paid30 = paid.filter((p) => p.createdAt >= d30);
  const paidPrev = paid.filter((p) => p.createdAt >= d60 && p.createdAt < d30);
  const revenue30 = paid30.reduce((s, p) => s + p.amountCents, 0);
  const revenuePrev = paidPrev.reduce((s, p) => s + p.amountCents, 0);
  const aovCents = paid.length ? Math.round(revenueCents / paid.length) : 0;

  // Per-bundle revenue attribution: split each order across its bundles by list-price weight.
  const byId = await bundleMapById();
  const bundleAgg = new Map<string, { name: string; family: string; units: number; revenueCents: number }>();
  const familyAgg = new Map<string, number>();
  for (const p of paid) {
    const ids = p.bundleIds.split(",").map((x) => x.trim()).filter(Boolean);
    if (!ids.length) continue;
    const weights = ids.map((id) => priceNum(byId.get(id)?.price || "0") || 1);
    const total = weights.reduce((a, b) => a + b, 0) || ids.length;
    ids.forEach((id, i) => {
      const b = byId.get(id);
      const share = Math.round((p.amountCents * weights[i]) / total);
      const cur = bundleAgg.get(id) || { name: b?.name || id, family: b?.family || "other", units: 0, revenueCents: 0 };
      cur.units += 1;
      cur.revenueCents += share;
      bundleAgg.set(id, cur);
      familyAgg.set(cur.family, (familyAgg.get(cur.family) || 0) + share);
    });
  }
  const topBundles = [...bundleAgg.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 5);
  const revenueByFamily = [...familyAgg.entries()].map(([family, revenueCents]) => ({ family, revenueCents })).sort((a, b) => b.revenueCents - a.revenueCents);

  // Generations broken down by source.
  const genBySource: Record<string, number> = {};
  for (const g of genRows) genBySource[g.source] = (genBySource[g.source] || 0) + 1;

  const recent = await prisma.generationEvent.findMany({ orderBy: { createdAt: "desc" }, take: 8 }).catch(() => []);

  return NextResponse.json({
    revenueCents,
    currency,
    orders: purchases.length,
    activeSubscriptions: activeSubs,
    customers: users,
    generations,
    // Enriched analytics
    revenue30Cents: revenue30,
    revenueDeltaPct: delta(revenue30, revenuePrev),
    orders30: paid30.length,
    ordersDeltaPct: delta(paid30.length, paidPrev.length),
    aovCents,
    newCustomers30: newUsers30,
    generations30: gens30,
    topBundles,
    revenueByFamily,
    genBySource,
    recent: recent.map((g) => ({ source: g.source, guideName: g.guideName, userEmail: g.userEmail, createdAt: g.createdAt.toISOString() })),
  });
}
