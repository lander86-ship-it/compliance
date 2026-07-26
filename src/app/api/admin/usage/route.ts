import { NextResponse } from "next/server";
import { getSessionUser, isBackOffice } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin usage dashboard data: users + their entitlements + recent generations.
export async function GET() {
  const user = await getSessionUser().catch(() => null);
  if (!user || !isBackOffice(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const [users, entitlements, events] = await Promise.all([
      prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.entitlement.findMany({ take: 1000 }),
      prisma.generationEvent.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    ]);
    const byUser = new Map<string, string[]>();
    for (const e of entitlements) { const a = byUser.get(e.userId) || []; a.push(e.bundleId); byUser.set(e.userId, a); }
    return NextResponse.json({
      users: users.map((u) => ({ ...u, bundles: byUser.get(u.id) || [] })),
      events,
      totals: { users: users.length, generations: events.length, entitlements: entitlements.length },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
