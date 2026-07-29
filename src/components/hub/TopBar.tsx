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
  if (["generator", "library", "license", "subscriptions", "invoices", "account"].includes(view)) return "customer";
  if (view.startsWith("admin")) return "admin";
  return "store";
}

export function TopBar() {
  const { s, go, logout } = useHub();
  const domain = domainOf(s.view);
  const isAdmin = s.user?.role === "admin" || s.user?.role === "owner";
  const tabs = tabDef.filter(([d]) => d !== "admin" || isAdmin);
  const m = s.isMobile;

  return (
    <header style={css(`height:62px;background:#FBFAF9;color:#1C1917;display:flex;align-items:center;position:sticky;top:0;z-index:50;border-bottom:1px solid #E7E6E5;${m ? "padding:0 12px;gap:10px;" : "padding:0 22px;gap:26px;"}`)}>
      <div style={css("display:flex;align-items:center;gap:9px;cursor:pointer;flex-shrink:0;")} onClick={() => go("storefront")}>
        <div style={css("height:30px;width:30px;border-radius:7px;background:#0f4c9c;color:#fff;display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;font-weight:700;font-size:16px;flex-shrink:0;")}>H</div>
        {!m && <span style={css("font-family:'DM Sans',sans-serif;font-weight:700;font-size:18px;letter-spacing:-.01em;color:#1C1917;")}>
          Harden<span style={{ color: "#0f4c9c" }}>Hub</span>
        </span>}
        {!m && <span style={css("font-size:10px;font-family:'Fragment Mono',monospace;color:#79716B;border:1px solid #E7E6E5;border-radius:20px;padding:2px 8px;margin-left:2px;")}>v0.1</span>}
      </div>
      <nav style={css(`display:flex;gap:4px;${m ? "overflow-x:auto;flex-shrink:1;min-width:0;" : ""}`)}>
        {tabs.map(([d, label, view]) => (
          <button
            key={d}
            onClick={() => go(view)}
            style={css(`white-space:nowrap;flex-shrink:0;background:${domain === d ? "#F1F2EA" : "transparent"};color:${domain === d ? "#1C1917" : "#79716B"};border:1px solid ${domain === d ? "#E7E6E5" : "transparent"};border-radius:999px;font-weight:${domain === d ? 600 : 500};cursor:pointer;${m ? "padding:7px 11px;font-size:12.5px;" : "padding:8px 16px;font-size:13.5px;"}`)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div style={css("flex:1;")} />
      {!m && (
        <div style={css("display:flex;align-items:center;background:#F7F7F5;border:1px solid #E7E6E5;border-radius:999px;padding:9px 15px;gap:8px;width:280px;")}>
          <span style={css("color:#79716B;font-size:13px;font-family:'Fragment Mono',monospace;")}>⌕</span>
          <input placeholder="Search benchmarks, controls, CVEs…" style={css("background:transparent;border:none;outline:none;color:#1C1917;font-size:13px;width:100%;")} />
        </div>
      )}
      <button onClick={() => go("cart")} style={css(`position:relative;background:#FBFAF9;border:1px solid #E7E6E5;color:#1C1917;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;flex-shrink:0;${m ? "padding:9px 13px;" : "padding:9px 18px;"}`)}>
        {m ? "🛒" : "Cart"}
        {s.cart.length > 0 && (
          <span style={css("position:absolute;top:-7px;right:-7px;background:#E4544B;color:#fff;font-size:10px;font-weight:700;border-radius:16px;min-width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;padding:0 4px;")}>{s.cart.length}</span>
        )}
      </button>
      {s.authStatus === "authed" && s.user ? (
        <div style={css("display:flex;align-items:center;gap:10px;flex-shrink:0;")}>
          {!m && <div style={css("text-align:right;line-height:1.2;")}>
            <div style={css("font-size:12.5px;font-weight:600;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;")}>{s.user.name || s.user.email}</div>
            <div style={css("font-size:10.5px;color:#79716B;text-transform:uppercase;letter-spacing:.5px;")}>{isAdmin ? "Admin" : "Customer"}</div>
          </div>}
          <div onClick={() => m && logout()} title={s.user.email} style={css("width:34px;height:34px;border-radius:50%;background:#0f4c9c;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;font-family:'Fragment Mono',monospace;flex-shrink:0;")}>{(s.user.name || s.user.email).slice(0, 2).toUpperCase()}</div>
          {!m && <button onClick={() => logout()} style={css("background:#FBFAF9;border:1px solid #E7E6E5;color:#57534E;border-radius:999px;padding:8px 14px;font-size:12.5px;font-weight:600;cursor:pointer;")}>Sign out</button>}
        </div>
      ) : (
        <button onClick={() => go("auth")} className="hh-primary" style={css(`background:#0f4c9c;color:#fff;border:none;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;flex-shrink:0;${m ? "padding:9px 14px;" : "padding:9px 20px;"}`)}>Sign in</button>
      )}
    </header>
  );
}
