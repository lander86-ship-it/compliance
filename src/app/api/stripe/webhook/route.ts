import { NextResponse } from "next/server";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { grantBundles } from "@/lib/entitlements";
import { recordPurchase } from "@/lib/purchases";
import { prisma } from "@/lib/db";
import type Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe webhook: the authoritative grant path. Fires even if the buyer closes the tab
// before the confirm-on-return call, so entitlements are never lost after a real payment.
// Configure the endpoint in Stripe → Developers → Webhooks and set STRIPE_WEBHOOK_SECRET.
export async function POST(req: Request) {
  if (!stripeEnabled()) return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 400 });

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    return NextResponse.json({ error: `Signature verification failed: ${e instanceof Error ? e.message : "unknown"}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid") {
      const userId = session.metadata?.userId;
      const bundleIds = (session.metadata?.bundleIds || "").split(",").map((s) => s.trim()).filter(Boolean);
      if (userId && bundleIds.length) {
        try {
          await grantBundles(userId, bundleIds);
          await recordPurchase({
            userId,
            userEmail: session.customer_details?.email || null,
            bundleIds,
            method: "stripe",
            amountCents: session.amount_total ?? undefined,
            currency: (session.currency || "usd").toUpperCase(),
            stripeSessionId: session.id, // idempotent — dupes from confirm-on-return are skipped
          });
          // Persist fiscal details Stripe collected (VAT id + billing name/address) onto the buyer.
          await persistFiscal(userId, session);
        } catch {
          /* best-effort — Stripe will retry on a non-2xx, so only fail on signature issues */
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}

async function persistFiscal(userId: string, session: Stripe.Checkout.Session): Promise<void> {
  const cd = session.customer_details;
  if (!cd) return;
  const addr = cd.address;
  const data: Record<string, unknown> = {};
  const taxId = cd.tax_ids?.[0]?.value;
  if (taxId) data.taxId = taxId;
  if (cd.name) data.billingName = cd.name;
  if (addr) {
    data.billingAddress = [addr.line1, addr.line2, addr.postal_code, addr.city, addr.state].filter(Boolean).join(", ");
    if (addr.country) data.country = addr.country;
  }
  if (Object.keys(data).length) await prisma.user.update({ where: { id: userId }, data }).catch(() => {});
}
