"use client";

import React from "react";
import { useHub } from "@/lib/hub/store";
import { css } from "@/lib/hub/theme";

const tabDef: [string, string, string][] = [
  ["store", "Storefront", "storefront"],
  ["customer", "My Library", "library"],
  ["admin", "Back Office", "admin-dashboard"],
];

export function domainOf(view: string): string {
  if (["library", "license", "subscriptions", "invoices", "account"].includes(view)) return "customer";
  if (view.startsWith("admin")) return "admin";
  return "store";
}

export function TopBar() {
  const { s, go } = useHub();
  const domain = domainOf(s.view);

  return (
    <header style={css("height:62px;background:#FBFAF9;color:#1C1917;display:flex;align-items:center;padding:0 22px;gap:26px;position:sticky;top:0;z-index:50;border-bottom:1px solid #E7E6E5;")}>
      <div style={css("display:flex;align-items:center;gap:9px;cursor:pointer;")} onClick={() => go("storefront")}>
        <div style={css("height:30px;width:30px;border-radius:7px;background:#0f4c9c;color:#fff;display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;font-weight:700;font-size:16px;")}>H</div>
        <span style={css("font-family:'DM Sans',sans-serif;font-weight:700;font-size:18px;letter-spacing:-.01em;color:#1C1917;")}>
          Harden<span style={{ color: "#0f4c9c" }}>Hub</span>
        </span>
        <span style={css("font-size:10px;font-family:'Fragment Mono',monospace;color:#79716B;border:1px solid #E7E6E5;border-radius:20px;padding:2px 8px;margin-left:2px;")}>v0.1</span>
      </div>
      <nav style={css("display:flex;gap:4px;")}>
        {tabDef.map(([d, label, view]) => (
          <button
            key={d}
            onClick={() => go(view)}
            style={css(`background:${domain === d ? "#F1F2EA" : "transparent"};color:${domain === d ? "#1C1917" : "#79716B"};border:1px solid ${domain === d ? "#E7E6E5" : "transparent"};border-radius:999px;padding:8px 16px;font-size:13.5px;font-weight:${domain === d ? 600 : 500};cursor:pointer;`)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div style={css("flex:1;")} />
      <div style={css("display:flex;align-items:center;background:#F7F7F5;border:1px solid #E7E6E5;border-radius:999px;padding:9px 15px;gap:8px;width:280px;")}>
        <span style={css("color:#79716B;font-size:13px;font-family:'Fragment Mono',monospace;")}>⌕</span>
        <input placeholder="Search benchmarks, controls, CVEs…" style={css("background:transparent;border:none;outline:none;color:#1C1917;font-size:13px;width:100%;")} />
      </div>
      <button onClick={() => go("cart")} style={css("position:relative;background:#FBFAF9;border:1px solid #E7E6E5;color:#1C1917;border-radius:999px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;")}>
        Cart
        {s.cart.length > 0 && (
          <span style={css("position:absolute;top:-7px;right:-7px;background:#E4544B;color:#fff;font-size:10px;font-weight:700;border-radius:16px;min-width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;padding:0 4px;")}>{s.cart.length}</span>
        )}
      </button>
      <div style={css("width:34px;height:34px;border-radius:50%;background:#0f4c9c;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;font-family:'Fragment Mono',monospace;")}>MT</div>
    </header>
  );
}
