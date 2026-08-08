"use client";

import React, { useEffect } from "react";
import { useHub } from "@/lib/hub/store";
import { css } from "@/lib/hub/theme";

const ROLE_LABEL: Record<string, string> = { owner: "Owner (admin)", admin: "Administrator", author: "Author", customer: "Customer" };

export function Account() {
  const { s, go, logout, loadPurchases } = useHub();

  useEffect(() => {
    if (s.purchasesStatus === "idle") loadPurchases();
  }, [s.purchasesStatus, loadPurchases]);

  const u = s.user;
  const subs = new Set<string>();
  for (const p of s.purchases || []) for (const b of p.bundles) subs.add(b.id);
  const row = "display:flex;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #EFEEEC;font-size:14px;";

  return (
    <div style={css("padding:26px 34px 60px;max-width:760px;")}>
      <h1 style={css("margin:0 0 6px;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>Account</h1>
      <p style={css("margin:0 0 22px;color:#57534E;font-size:14px;")}>Your profile and plan.</p>

      <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:20px;overflow:hidden;margin-bottom:20px;")}>
        <div style={css(row)}><span style={css("color:#79716B;")}>Name</span><span style={css("font-weight:600;")}>{u?.name || "—"}</span></div>
        <div style={css(row)}><span style={css("color:#79716B;")}>Email</span><span style={css("font-weight:600;")}>{u?.email || "—"}</span></div>
        <div style={css(row)}><span style={css("color:#79716B;")}>Role</span><span style={css("font-weight:600;")}>{ROLE_LABEL[u?.role || ""] || u?.role || "—"}</span></div>
        <div style={css(row + "border-bottom:none;")}><span style={css("color:#79716B;")}>Active subscriptions</span><span style={css("font-weight:600;")}>{s.entAdmin ? "All (admin)" : subs.size}</span></div>
      </div>

      <div style={css("display:flex;gap:10px;flex-wrap:wrap;")}>
        <button onClick={() => go("subscriptions")} style={css("background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:11px 20px;font-size:13.5px;font-weight:600;cursor:pointer;")}>View subscriptions</button>
        <button onClick={() => go("invoices")} style={css("background:#fff;color:#0f4c9c;border:1px solid #c3d2ea;border-radius:999px;padding:11px 20px;font-size:13.5px;font-weight:600;cursor:pointer;")}>View invoices</button>
        <button onClick={() => logout()} style={css("background:#fff;color:#8a3b3b;border:1px solid #e3c9c9;border-radius:999px;padding:11px 20px;font-size:13.5px;font-weight:600;cursor:pointer;margin-left:auto;")}>Sign out</button>
      </div>
    </div>
  );
}
