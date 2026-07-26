import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { entitlementsFor, entitlementsForRole } from "@/lib/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ entitlements: null }, { status: 401 });
  const admin = entitlementsForRole(user.role);
  const ent = admin || (await entitlementsFor(user.id));
  return NextResponse.json({ entitlements: ent, admin: !!admin });
}
