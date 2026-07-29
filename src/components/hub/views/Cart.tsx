"use client";

import React from "react";
import { useHub } from "@/lib/hub/store";
import { css, fwStyle } from "@/lib/hub/theme";
import { findItem, priceNum, fmt, type Bundle } from "@/lib/hub/data";

export function Cart() {
  const { s, set, go, removeFromCart } = useHub();
  const rows = s.cart.map((id) => findItem(id)).filter(Boolean) as (ReturnType<typeof findItem> & object)[];
  const subtotal = rows.reduce((a, p) => a + priceNum((p as { price: string }).price), 0);
  const discount = s.coupon === "HARDEN25" ? Math.round(subtotal * 0.25) : 0;
  const taxable = subtotal - discount;
  const vat = Math.round(taxable * 0.21);
  const total = taxable + vat;

  return (
    <div style={css(`max-width:1020px;${s.isMobile ? "padding:20px 16px 48px;" : "padding:26px 34px 60px;"}`)}>
      <h1 style={css("margin:0 0 22px;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>Cart</h1>
      <div style={css(`display:grid;grid-template-columns:${s.isMobile ? "1fr" : "1fr 320px"};gap:${s.isMobile ? "18px" : "26px"};align-items:start;`)}>
        <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;overflow:hidden;")}>
          {rows.map((p) => {
            const item = p as Bundle & { price: string; framework: string; name: string; count?: number; profiles?: string };
            const sub = item.count ? `${item.count} items` : `${item.profiles} · one-organization license`;
            return (
              <div key={item.id} style={css("display:flex;gap:16px;padding:18px;border-bottom:1px solid #EFEEEC;align-items:center;")}>
                <div style={css("width:44px;height:44px;border-radius:8px;background:#F1F2EA;display:flex;align-items:center;justify-content:center;font-family:'Fragment Mono',monospace;font-weight:600;color:#0f4c9c;font-size:12px;flex-shrink:0;")}>{item.framework}</div>
                <div style={css("flex:1;")}>
                  <div style={css("font-size:14.5px;font-weight:600;")}>{item.name}</div>
                  <div style={css("font-size:12px;color:#79716B;font-family:'Fragment Mono',monospace;margin-top:3px;")}>{sub}</div>
                </div>
                <div style={css("font-size:15px;font-weight:700;color:#1C1917;")}>{item.price}</div>
                <button onClick={() => removeFromCart(item.id)} style={css("background:transparent;border:none;color:#b4381f;font-size:12px;cursor:pointer;")}>Remove</button>
              </div>
            );
          })}
          {rows.length === 0 && (
            <div style={css("padding:40px;text-align:center;color:#79716B;font-size:14px;")}>
              Your cart is empty. <span onClick={() => go("storefront")} style={css("color:#1663d6;cursor:pointer;")}>Browse the catalog →</span>
            </div>
          )}
        </div>
        <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;padding:20px;")}>
          <div style={css("display:flex;gap:8px;margin-bottom:16px;")}>
            <input value={s.coupon} onChange={(e) => set({ coupon: e.target.value.toUpperCase() })} placeholder="Coupon code" style={css("flex:1;border:1px solid #E7E6E5;border-radius:7px;padding:9px 11px;font-size:13px;font-family:'Fragment Mono',monospace;text-transform:uppercase;outline:none;")} />
            <button style={css("background:#F1F2EA;border:1px solid #E7E6E5;border-radius:999px;padding:9px 15px;font-size:13px;font-weight:600;cursor:pointer;color:#0f4c9c;")}>Apply</button>
          </div>
          <div style={css("font-size:11px;color:#79716B;margin-bottom:16px;")}>
            Try <b style={css("font-family:'Fragment Mono',monospace;color:#1f7a4d;")}>HARDEN25</b> for 25% off.
          </div>
          <div style={css("display:flex;justify-content:space-between;font-size:13.5px;padding:6px 0;color:#57534E;")}><span>Subtotal</span><span style={css("font-family:'Fragment Mono',monospace;")}>{fmt(subtotal)}</span></div>
          {discount > 0 && (
            <div style={css("display:flex;justify-content:space-between;font-size:13.5px;padding:6px 0;color:#1f7a4d;")}><span>Discount (HARDEN25)</span><span style={css("font-family:'Fragment Mono',monospace;")}>−{fmt(discount)}</span></div>
          )}
          <div style={css("display:flex;justify-content:space-between;font-size:13.5px;padding:6px 0;color:#57534E;")}><span>VAT (21%)</span><span style={css("font-family:'Fragment Mono',monospace;")}>{fmt(vat)}</span></div>
          <div style={css("display:flex;justify-content:space-between;font-size:17px;font-weight:700;padding:12px 0 4px;border-top:1px solid #EFEEEC;margin-top:8px;color:#1C1917;")}><span>Total</span><span style={css("font-family:'Fragment Mono',monospace;")}>{fmt(total)}</span></div>
          <button onClick={() => go("checkout")} className="hh-primary" style={css("width:100%;background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:13px 24px;font-size:14px;font-weight:600;cursor:pointer;margin-top:16px;")}>Proceed to checkout</button>
        </div>
      </div>
    </div>
  );
}
