// Purchase records: the financial/audit side of a checkout (access itself is
// granted via Entitlement). One Purchase per completed checkout, shown in the
// buyer's Subscriptions/Invoices views and the admin Orders/revenue dashboard.

import { prisma } from "./db";
import { BUNDLES, priceNum, type Bundle } from "./hub/data";

const bundleById = new Map<string, Bundle>(BUNDLES.map((b) => [b.id, b]));

export type PurchaseView = {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  status: string;
  method: string;
  currency: string;
  amountCents: number;
  bundles: { id: string; name: string; price: string; sources: string[]; categories: string[] }[];
};

// Sum a set of bundle list prices, in cents.
export function bundlesTotalCents(bundleIds: string[]): number {
  return bundleIds.reduce((sum, id) => sum + Math.round(priceNum(bundleById.get(id)?.price || "0") * 100), 0);
}

// Human invoice number, sequential within the year (best-effort; unique-guarded).
async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.purchase.count().catch(() => 0);
  return `INV-${year}-${String(count + 1).padStart(5, "0")}`;
}

// Record a completed purchase. Idempotent per Stripe session (skips duplicates).
export async function recordPurchase(args: {
  userId: string;
  userEmail?: string | null;
  bundleIds: string[];
  method: "stripe" | "stub" | "demo" | "po";
  amountCents?: number;
  currency?: string;
  status?: string;
  stripeSessionId?: string | null;
}): Promise<void> {
  const bundleIds = args.bundleIds.filter((id) => bundleById.has(id));
  if (!bundleIds.length) return;
  try {
    if (args.stripeSessionId) {
      const existing = await prisma.purchase.findFirst({ where: { stripeSessionId: args.stripeSessionId } });
      if (existing) return;
    }
    await prisma.purchase.create({
      data: {
        userId: args.userId,
        userEmail: args.userEmail ?? null,
        bundleIds: bundleIds.join(","),
        amountCents: args.amountCents ?? bundlesTotalCents(bundleIds),
        currency: (args.currency || "USD").toUpperCase(),
        status: args.status || "paid",
        method: args.method,
        stripeSessionId: args.stripeSessionId ?? null,
        invoiceNumber: await nextInvoiceNumber(),
      },
    });
  } catch {
    /* purchase table not migrated yet — access grant already succeeded */
  }
}

function toView(p: { id: string; invoiceNumber: string; createdAt: Date; status: string; method: string; currency: string; amountCents: number; bundleIds: string }): PurchaseView {
  const ids = p.bundleIds.split(",").map((s) => s.trim()).filter(Boolean);
  return {
    id: p.id,
    invoiceNumber: p.invoiceNumber,
    createdAt: p.createdAt.toISOString(),
    status: p.status,
    method: p.method,
    currency: p.currency,
    amountCents: p.amountCents,
    bundles: ids.map((id) => {
      const b = bundleById.get(id);
      return { id, name: b?.name || id, price: b?.price || "", sources: b?.sources || [], categories: b?.categories || [] };
    }),
  };
}

export async function purchasesForUser(userId: string): Promise<PurchaseView[]> {
  const rows = await prisma.purchase.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }).catch(() => []);
  return rows.map(toView);
}

export async function purchaseById(id: string): Promise<(PurchaseView & { userId: string; userEmail: string | null }) | null> {
  const p = await prisma.purchase.findUnique({ where: { id } }).catch(() => null);
  if (!p) return null;
  return { ...toView(p), userId: p.userId, userEmail: p.userEmail };
}

export async function allPurchases(limit = 200): Promise<(PurchaseView & { userEmail: string | null })[]> {
  const rows = await prisma.purchase.findMany({ orderBy: { createdAt: "desc" }, take: limit }).catch(() => []);
  return rows.map((p) => ({ ...toView(p), userEmail: p.userEmail }));
}
