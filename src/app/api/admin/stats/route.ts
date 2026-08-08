import { NextResponse } from "next/server";
import { getSessionUser, isBackOffice } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Aggregate KPIs for the admin dashboard: revenue, orders, subscriptions, users, generations.
export async function GET() {
  const user = await getSessionUser().catch(() => null);
  if (!user || !isBackOffice(user.role)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const [purchases, activeSubs, users, generations] = await Promise.all([
    prisma.purchase.findMany({ select: { amountCents: true, currency: true, status: true } }).catch(() => []),
    prisma.entitlement.count().catch(() => 0),
    prisma.user.count().catch(() => 0),
    prisma.generationEvent.count().catch(() => 0),
  ]);

  const paid = purchases.filter((p) => p.status === "paid");
  const revenueCents = paid.reduce((s, p) => s + p.amountCents, 0);
  const currency = paid[0]?.currency || "USD";

  // Recent generations for the activity feed.
  const recent = await prisma.generationEvent
    .findMany({ orderBy: { createdAt: "desc" }, take: 8 })
    .catch(() => []);

  return NextResponse.json({
    revenueCents,
    currency,
    orders: purchases.length,
    activeSubscriptions: activeSubs,
    customers: users,
    generations,
    recent: recent.map((g) => ({ source: g.source, guideName: g.guideName, userEmail: g.userEmail, createdAt: g.createdAt.toISOString() })),
  });
}
