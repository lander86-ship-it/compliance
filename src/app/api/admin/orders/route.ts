import { NextResponse } from "next/server";
import { getSessionUser, isBackOffice } from "@/lib/auth";
import { allPurchases } from "@/lib/purchases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// All purchases across customers (admin Orders view).
export async function GET() {
  const user = await getSessionUser().catch(() => null);
  if (!user || !isBackOffice(user.role)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  return NextResponse.json({ orders: await allPurchases() });
}
