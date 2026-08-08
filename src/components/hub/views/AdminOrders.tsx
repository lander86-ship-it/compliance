"use client";

import React, { useEffect, useState } from "react";
import { css, statusPill } from "@/lib/hub/theme";

type Order = { id: string; invoiceNumber: string; userEmail: string | null; createdAt: string; status: string; method: string; currency: string; amountCents: number; bundles: { name: string }[] };

function money(cents: number, currency: string): string {
  const sym = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${sym}${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
const statusColor: Record<string, string> = { paid: "#1f7a4d", pending: "#b5721c", refunded: "#8a3b3b" };

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/orders").then((r) => (r.ok ? r.json() : { orders: [] })).then((d) => setOrders(d.orders || [])).catch(() => setOrders([]));
  }, []);

  return (
    <div style={css("padding:26px 34px 60px;max-width:1040px;")}>
      <h1 style={css("margin:0 0 22px;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>Orders</h1>
      {orders === null ? (
        <div style={css("color:#79716B;font-size:14px;padding:30px 0;")}>Loading orders…</div>
      ) : orders.length === 0 ? (
        <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;padding:44px;text-align:center;color:#79716B;font-size:14px;")}>No orders yet. Purchases will appear here as customers buy bundles.</div>
      ) : (
        <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;overflow:hidden;")}>
          <div style={css("display:grid;grid-template-columns:130px 1fr 1fr 110px 110px 70px;background:#F1F2EA;border-bottom:1px solid #E7E6E5;padding:11px 18px;font-size:11px;font-weight:600;color:#79716B;text-transform:uppercase;letter-spacing:.4px;")}>
            <div>Invoice</div>
            <div>Customer</div>
            <div>Items</div>
            <div>Total</div>
            <div>Status</div>
            <div style={css("text-align:right;")}>PDF</div>
          </div>
          {orders.map((o) => (
            <div key={o.id} style={css("display:grid;grid-template-columns:130px 1fr 1fr 110px 110px 70px;padding:14px 18px;border-bottom:1px solid #EFEEEC;font-size:13px;align-items:center;")}>
              <div style={css("font-family:'Fragment Mono',monospace;font-weight:600;font-size:12px;")}>{o.invoiceNumber}</div>
              <div style={css("min-width:0;overflow:hidden;text-overflow:ellipsis;")}>{o.userEmail || "—"}</div>
              <div style={css("color:#57534E;")}>{o.bundles.map((b) => b.name).join(", ") || "—"}</div>
              <div style={css("font-family:'Fragment Mono',monospace;font-weight:600;")}>{money(o.amountCents, o.currency)}</div>
              <div><span style={css(statusPill(statusColor[o.status] || "#79716B"))}>{o.status}</span></div>
              <div style={css("text-align:right;")}><a href={`/api/invoices/${o.id}`} style={css("color:#1663d6;font-size:12px;text-decoration:none;font-weight:600;")}>↓</a></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
