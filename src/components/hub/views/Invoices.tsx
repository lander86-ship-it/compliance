"use client";

import React, { useEffect } from "react";
import { useHub } from "@/lib/hub/store";
import { css, statusPill } from "@/lib/hub/theme";

function money(cents: number, currency: string): string {
  const sym = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${sym}${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const METHOD_LABEL: Record<string, string> = { stripe: "Card (Stripe)", stub: "Simulated", demo: "Demo (no charge)", po: "Purchase order" };

export function Invoices() {
  const { s, go, loadPurchases } = useHub();

  useEffect(() => {
    if (s.purchasesStatus === "idle") loadPurchases();
  }, [s.purchasesStatus, loadPurchases]);

  const loading = s.purchasesStatus === "loading" || s.purchasesStatus === "idle";
  const invoices = s.purchases || [];

  return (
    <div style={css("padding:26px 34px 60px;max-width:1000px;")}>
      <h1 style={css("margin:0 0 6px;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>Invoices</h1>
      <p style={css("margin:0 0 22px;color:#57534E;font-size:14px;")}>Every purchase and its downloadable PDF invoice.</p>

      {loading ? (
        <div style={css("color:#79716B;font-size:14px;padding:40px 0;")}>Loading your invoices…</div>
      ) : invoices.length === 0 ? (
        <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:20px;padding:44px;text-align:center;")}>
          <div style={css("font-size:15px;font-weight:600;margin-bottom:6px;")}>No invoices yet</div>
          <p style={css("margin:0 0 18px;color:#79716B;font-size:13.5px;")}>Your invoices will appear here after your first purchase.</p>
          <button onClick={() => go("storefront")} className="hh-primary" style={css("background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:11px 22px;font-size:13.5px;font-weight:600;cursor:pointer;")}>Browse bundles</button>
        </div>
      ) : (
        <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:20px;overflow:hidden;")}>
          <div style={css("display:grid;grid-template-columns:1.2fr 1.6fr 1fr .8fr .9fr;background:#F1F2EA;border-bottom:1px solid #E7E6E5;padding:11px 18px;font-size:11px;font-weight:600;color:#79716B;text-transform:uppercase;letter-spacing:.4px;")}>
            <div>Invoice</div>
            <div>Items</div>
            <div>Date</div>
            <div>Total</div>
            <div style={css("text-align:right;")}>PDF</div>
          </div>
          {invoices.map((p) => (
            <div key={p.id} style={css("display:grid;grid-template-columns:1.2fr 1.6fr 1fr .8fr .9fr;padding:15px 18px;border-bottom:1px solid #EFEEEC;font-size:13px;align-items:center;")}>
              <div>
                <div style={css("font-weight:600;font-family:'Fragment Mono',monospace;font-size:12.5px;")}>{p.invoiceNumber}</div>
                <span style={css(statusPill(p.status === "paid" ? "#1f7a4d" : "#b5721c") + "margin-top:5px;display:inline-block;")}>{p.status}</span>
              </div>
              <div style={css("color:#57534E;")}>
                {p.bundles.map((b) => b.name).join(", ") || "—"}
                <div style={css("font-size:11px;color:#a8a29e;margin-top:2px;")}>{METHOD_LABEL[p.method] || p.method}</div>
              </div>
              <div style={css("color:#57534E;font-family:'Fragment Mono',monospace;font-size:12px;")}>{new Date(p.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
              <div style={css("font-weight:600;")}>{money(p.amountCents, p.currency)}</div>
              <div style={css("text-align:right;")}>
                <a href={`/api/invoices/${p.id}`} style={css("text-decoration:none;font-size:12px;font-weight:600;color:#0f4c9c;background:#F1F2EA;padding:7px 12px;border-radius:7px;")}>↓ PDF</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
