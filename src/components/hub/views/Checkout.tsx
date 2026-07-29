"use client";

import React from "react";
import { useHub } from "@/lib/hub/store";
import { css } from "@/lib/hub/theme";
import { findItem, priceNum, fmt, type Bundle } from "@/lib/hub/data";

const billingFields = [
  { label: "Organization (legal name)", value: "Northwind Financial Group", full: true, mono: false },
  { label: "VAT number (EU)", value: "ES B12345678", full: false, mono: true, note: "✓ VIES validated · reverse-charge applies" },
  { label: "Country", value: "Spain", full: false, mono: false },
  { label: "Billing address", value: "Paseo de la Castellana 200, 28046 Madrid", full: true, mono: false },
];

export function Checkout() {
  const { s, set, go, purchase } = useHub();
  const rows = s.cart.map((id) => findItem(id)).filter(Boolean) as (Bundle & { price: string; name: string })[];

  const placeOrder = async () => {
    if (s.authStatus !== "authed") { go("auth"); return; }
    const ok = await purchase(s.cart);
    if (ok) set({ view: "generator", justOrdered: true });
  };
  const subtotal = rows.reduce((a, p) => a + priceNum(p.price), 0);
  const discount = s.coupon === "HARDEN25" ? Math.round(subtotal * 0.25) : 0;
  const vat = Math.round((subtotal - discount) * 0.21);
  const total = subtotal - discount + vat;

  const payMethods: [string, string][] = [
    ["card", "Credit / debit card"],
    ["po", "Invoice / Purchase Order"],
  ];

  return (
    <div style={css(`max-width:1020px;${s.isMobile ? "padding:20px 16px 48px;" : "padding:26px 34px 60px;"}`)}>
      <div style={css("font-size:12px;color:#79716B;margin-bottom:8px;font-family:'Fragment Mono',monospace;")}>
        <span onClick={() => go("cart")} style={css("cursor:pointer;color:#1663d6;")}>Cart</span> / Checkout
      </div>
      <h1 style={css("margin:0 0 22px;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>Checkout</h1>
      <div style={css(`display:grid;grid-template-columns:${s.isMobile ? "1fr" : "1fr 320px"};gap:${s.isMobile ? "18px" : "26px"};align-items:start;`)}>
        <div style={css("display:flex;flex-direction:column;gap:20px;")}>
          <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;padding:22px;")}>
            <h3 style={css("margin:0 0 16px;font-size:15px;font-weight:600;")}>Billing details</h3>
            <div style={css(`display:grid;grid-template-columns:${s.isMobile ? "1fr" : "1fr 1fr"};gap:12px;`)}>
              {billingFields.map((f) => (
                <div key={f.label} style={f.full ? css("grid-column:1/3;") : undefined}>
                  <label style={css("font-size:12px;font-weight:600;color:#57534E;display:block;margin-bottom:5px;")}>{f.label}</label>
                  <input defaultValue={f.value} style={css(`width:100%;border:1px solid #E7E6E5;border-radius:7px;padding:10px 12px;font-size:13.5px;outline:none;${f.mono ? "font-family:'Fragment Mono',monospace;" : ""}`)} />
                  {f.note && <div style={css("font-size:11px;color:#1f7a4d;margin-top:5px;")}>{f.note}</div>}
                </div>
              ))}
            </div>
          </div>
          <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;padding:22px;")}>
            <h3 style={css("margin:0 0 16px;font-size:15px;font-weight:600;")}>Payment method</h3>
            <div style={css("display:flex;gap:12px;margin-bottom:18px;")}>
              {payMethods.map(([id, label]) => {
                const on = s.pay === id;
                return (
                  <button key={id} onClick={() => set({ pay: id as "card" | "po" })} style={css(`flex:1;background:${on ? "#F1F2EA" : "#fff"};border:1px solid ${on ? "#0f4c9c" : "#E7E6E5"};color:#1C1917;border-radius:8px;padding:12px;font-size:13px;font-weight:600;cursor:pointer;`)}>{label}</button>
                );
              })}
            </div>
            {s.pay === "card" ? (
              <div style={css("border:1px solid #E7E6E5;border-radius:9px;padding:16px;background:#FBFAF9;")}>
                <div style={css("display:flex;align-items:center;gap:8px;margin-bottom:12px;font-size:12px;color:#57534E;")}>
                  <span style={css("font-family:'Fragment Mono',monospace;font-weight:600;color:#635bff;")}>stripe</span> · secured payment — HardenHub stores no card data
                </div>
                <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:7px;padding:12px 14px;font-family:'Fragment Mono',monospace;font-size:13.5px;color:#57534E;display:flex;justify-content:space-between;")}>
                  4242 4242 4242 4242 <span style={css("color:#79716B;")}>12/28 · 123</span>
                </div>
              </div>
            ) : (
              <div style={css("border:1px solid #E7E6E5;border-radius:9px;padding:16px;background:#FBFAF9;font-size:13px;color:#57534E;line-height:1.6;")}>
                Order will be created as <b style={css("color:#b5721c;")}>Pending payment</b>. An invoice with PO reference is emailed; access unlocks on reconciliation.
              </div>
            )}
          </div>
        </div>
        <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;padding:20px;position:sticky;top:20px;")}>
          <h3 style={css("margin:0 0 14px;font-size:14px;font-weight:600;")}>Order summary</h3>
          {rows.map((p) => (
            <div key={p.id} style={css("display:flex;justify-content:space-between;font-size:12.5px;padding:5px 0;color:#57534E;")}>
              <span style={css("max-width:190px;")}>{p.name}</span>
              <span style={css("font-family:'Fragment Mono',monospace;")}>{p.price}</span>
            </div>
          ))}
          <div style={css("display:flex;justify-content:space-between;font-size:13px;padding:6px 0;color:#57534E;border-top:1px solid #EFEEEC;margin-top:8px;")}><span>VAT (reverse-charge)</span><span style={css("font-family:'Fragment Mono',monospace;")}>{fmt(vat)}</span></div>
          <div style={css("display:flex;justify-content:space-between;font-size:17px;font-weight:700;padding:10px 0 4px;color:#1C1917;")}><span>Total</span><span style={css("font-family:'Fragment Mono',monospace;")}>{fmt(total)}</span></div>
          <button onClick={placeOrder} disabled={s.purchaseBusy || s.cart.length === 0} style={css(`width:100%;background:${s.purchaseBusy ? "#7fb195" : "#1f7a4d"};color:#fff;border:none;border-radius:999px;padding:13px 24px;font-size:14px;font-weight:600;cursor:pointer;margin-top:16px;`)}>{s.purchaseBusy ? "Processing…" : s.authStatus !== "authed" ? "Sign in to purchase" : "Pay & unlock generation"}</button>
          <div style={css("font-size:11px;color:#79716B;text-align:center;margin-top:10px;line-height:1.5;")}>By ordering you accept the per-organization license terms.</div>
        </div>
      </div>
    </div>
  );
}
