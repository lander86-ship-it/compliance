import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { grantBundles, entitlementsFor } from "@/lib/entitlements";
import { recordPurchase } from "@/lib/purchases";
import { stripeEnabled, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Confirm a returning Stripe Checkout session and grant the purchased bundles.
// Called by the client on the /?session_id=... return URL (no webhook needed).
export async function GET(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  if (!stripeEnabled()) return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ ok: false, pending: true, detail: "Payment not completed yet." });
    }
    // Only the buyer may claim their own session.
    if (session.metadata?.userId && session.metadata.userId !== user.id) {
      return NextResponse.json({ error: "This purchase belongs to another account." }, { status: 403 });
    }
    const bundleIds = (session.metadata?.bundleIds || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (bundleIds.length) {
      await grantBundles(user.id, bundleIds);
      await recordPurchase({
        userId: user.id,
        userEmail: user.email,
        bundleIds,
        method: "stripe",
        amountCents: session.amount_total ?? undefined,
        currency: (session.currency || "usd").toUpperCase(),
        stripeSessionId: session.id,
      });
    }
    const entitlements = await entitlementsFor(user.id);
    return NextResponse.json({ ok: true, entitlements });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Confirmation failed" }, { status: 502 });
  }
}
