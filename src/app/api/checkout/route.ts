import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { grantBundles, entitlementsFor } from "@/lib/entitlements";

export const runtime = "nodejs";

const schema = z.object({ bundleIds: z.array(z.string()).min(1) });

// Stub checkout: grants the purchased bundles to the signed-in user (payment is
// wired via Stripe elsewhere; here we simulate a completed purchase for the MVP).
export async function POST(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in to purchase." }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  try {
    await grantBundles(user.id, parsed.data.bundleIds);
    const entitlements = await entitlementsFor(user.id);
    return NextResponse.json({ ok: true, entitlements });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Checkout failed" }, { status: 500 });
  }
}
