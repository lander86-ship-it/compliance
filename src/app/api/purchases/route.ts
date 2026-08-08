import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { purchasesForUser } from "@/lib/purchases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The signed-in buyer's purchases — drives the Subscriptions and Invoices views.
export async function GET() {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ purchases: [] }, { status: 401 });
  return NextResponse.json({ purchases: await purchasesForUser(user.id) });
}
