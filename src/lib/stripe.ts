// Stripe integration (optional). When STRIPE_SECRET_KEY is set, purchases go through
// Stripe Checkout; otherwise the app falls back to a stub grant so it stays usable.

import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function stripeEnabled(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

export function appBaseUrl(req: Request): string {
  // Prefer the configured public URL; fall back to the request origin.
  return process.env.APP_BASE_URL || new URL(req.url).origin;
}
