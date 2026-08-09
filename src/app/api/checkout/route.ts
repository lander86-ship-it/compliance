import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { grantBundles, entitlementsFor } from "@/lib/entitlements";
import { recordPurchase } from "@/lib/purchases";
import { stripeEnabled, getStripe, appBaseUrl } from "@/lib/stripe";
import { priceNum } from "@/lib/hub/data";
import { mergedBundles } from "@/lib/catalog";

export const runtime = "nodejs";

const schema = z.object({ bundleIds: z.array(z.string()).min(1) });
const DEMO_EMAILS = (process.env.DEMO_CUSTOMER_EMAILS || "cliente@demo.hardenhub.app").split(",").map((s) => s.trim().toLowerCase());

// Checkout: real Stripe Checkout when configured; a stub grant otherwise (or for the
// demo customer, whose purchases are always simulated).
export async function POST(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in to purchase." }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const BUNDLES = await mergedBundles();
  const bundleIds = parsed.data.bundleIds.filter((id) => BUNDLES.some((b) => b.id === id));
  if (!bundleIds.length) return NextResponse.json({ error: "No valid bundles selected." }, { status: 400 });

  const isDemo = DEMO_EMAILS.includes(user.email.toLowerCase());

  // Real payment path.
  if (stripeEnabled() && !isDemo) {
    try {
      const stripe = getStripe();
      const base = appBaseUrl(req);
      const line_items = bundleIds.map((id) => {
        const b = BUNDLES.find((x) => x.id === id)!;
        return {
          quantity: 1,
          price_data: { currency: "usd", unit_amount: Math.round(priceNum(b.price) * 100), product_data: { name: b.name, description: b.tagline?.slice(0, 200) } },
        };
      });
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items,
        customer_email: user.email,
        metadata: { userId: user.id, bundleIds: bundleIds.join(",") },
        success_url: `${base}/?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/?checkout=cancel`,
      });
      return NextResponse.json({ checkoutUrl: session.url });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Stripe checkout failed" }, { status: 502 });
    }
  }

  // Stub / demo path: grant immediately and record the (simulated) purchase.
  try {
    await grantBundles(user.id, bundleIds);
    await recordPurchase({ userId: user.id, userEmail: user.email, bundleIds, method: isDemo ? "demo" : "stub", currency: "USD" });
    const entitlements = await entitlementsFor(user.id);
    return NextResponse.json({ ok: true, stub: true, entitlements });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Checkout failed" }, { status: 500 });
  }
}
