"use client";

import React from "react";
import { useHub } from "@/lib/hub/store";
import { css } from "@/lib/hub/theme";
import { Icon } from "./Icon";
import { domainOf } from "./TopBar";

const navDefs: Record<string, [string, string][]> = {
  store: [
    ["Catalog", "storefront"],
    ["Bundles", "storefront"],
    ["Frameworks", "storefront"],
    ["Free guides", "storefront"],
    ["Cart", "cart"],
  ],
  customer: [
    ["Library", "library"],
    ["Licenses", "license"],
    ["Subscriptions", "library"],
    ["Invoices", "library"],
    ["Account", "library"],
  ],
  admin: [
    ["Dashboard", "admin-dashboard"],
    ["AI Generator", "admin-ingest"],
    ["Control editor", "admin-editor"],
    ["Catalog & pricing", "admin-catalog"],
    ["Orders", "admin-orders"],
    ["Versioning", "admin-versioning"],
    ["Audit log", "admin-dashboard"],
  ],
};

const titles: Record<string, string> = { store: "Storefront", customer: "My account", admin: "Back office" };

export function Sidebar() {
  const { s, go } = useHub();
  const domain = domainOf(s.view);
  const items = navDefs[domain];

  return (
    <aside style={css("width:236px;background:#F1F2EA;border-right:1px solid #E7E6E5;padding:18px 0;display:flex;flex-direction:column;flex-shrink:0;")}>
      <div style={css("padding:0 20px 10px;font-size:11px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:#79716B;")}>{titles[domain]}</div>
      {items.map(([label, view], i) => {
        const active = s.view === view || (view === "storefront" && s.view === "product");
        const badge = label === "Cart" && s.cart.length ? String(s.cart.length) : label === "Orders" ? "3" : "";
        return (
          <button
            key={`${label}-${i}`}
            onClick={() => go(view)}
            style={css(`display:flex;align-items:center;justify-content:space-between;width:calc(100% - 12px);margin:1px 6px;text-align:left;background:${active ? "#F1F2EA" : "transparent"};color:${active ? "#1C1917" : "#57534E"};border:none;border-left:3px solid ${active ? "#0f4c9c" : "transparent"};border-radius:0 6px 6px 0;padding:9px 14px;font-size:13.5px;font-weight:${active ? 600 : 500};cursor:pointer;`)}
          >
            <span style={css("display:flex;align-items:center;gap:11px;")}>
              <span style={css("display:inline-flex;color:#79716B;")}>
                <Icon name={label} />
              </span>
              {label}
            </span>
            {badge && <span style={css("background:#0f4c9c;color:#fff;font-size:10px;font-weight:700;border-radius:16px;padding:1px 6px;")}>{badge}</span>}
          </button>
        );
      })}
      <div style={css("flex:1;")} />
      <div style={css("margin:0 16px;padding:12px 14px;background:#F1F2EA;border:1px solid #E7E6E5;border-radius:8px;")}>
        <div style={css("font-size:12px;font-weight:600;color:#0f4c9c;margin-bottom:3px;")}>CIS SecureSuite</div>
        <div style={css("font-size:11px;line-height:1.45;color:#57534E;")}>Commercial license active — derivatives permitted.</div>
      </div>
    </aside>
  );
}
