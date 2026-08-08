"use client";

import React, { useEffect, useState } from "react";
import { css } from "@/lib/hub/theme";
import { useHub } from "@/lib/hub/store";

type Stats = {
  revenueCents: number;
  currency: string;
  orders: number;
  activeSubscriptions: number;
  customers: number;
  generations: number;
  recent: { source: string; guideName: string | null; userEmail: string | null; createdAt: string }[];
};

function money(cents: number, currency: string): string {
  const sym = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${sym}${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function AdminDashboard() {
  const { s } = useHub();
  const m = s.isMobile;
  const [d, setD] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => (r.ok ? r.json() : null)).then((x) => x && setD(x)).catch(() => {});
  }, []);

  const kpis = [
    { k: "Revenue", v: d ? money(d.revenueCents, d.currency) : "—" },
    { k: "Orders", v: d ? String(d.orders) : "—" },
    { k: "Active subscriptions", v: d ? String(d.activeSubscriptions) : "—" },
    { k: "Customers", v: d ? String(d.customers) : "—" },
  ];

  return (
    <div style={css(`max-width:1180px;${m ? "padding:18px 14px 48px;" : "padding:26px 34px 60px;"}`)}>
      <h1 style={css("margin:0 0 22px;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>Dashboard</h1>
      <div style={css(`display:grid;grid-template-columns:repeat(${m ? 2 : 4},1fr);gap:16px;margin-bottom:22px;`)}>
        {kpis.map((k) => (
          <div key={k.k} style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:20px;padding:18px;")}>
            <div style={css("font-size:12px;color:#79716B;margin-bottom:8px;")}>{k.k}</div>
            <div style={css("font-size:26px;font-weight:700;color:#1C1917;letter-spacing:-.5px;font-family:'Fragment Mono',monospace;")}>{k.v}</div>
          </div>
        ))}
      </div>
      <div style={css(`display:grid;grid-template-columns:${m ? "1fr" : "1.5fr 1fr"};gap:18px;`)}>
        <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;padding:20px;")}>
          <h3 style={css("margin:0 0 16px;font-size:15px;font-weight:600;")}>Recent generations</h3>
          {!d ? (
            <div style={css("color:#79716B;font-size:13px;")}>Loading…</div>
          ) : d.recent.length === 0 ? (
            <div style={css("color:#79716B;font-size:13px;")}>No guides generated yet.</div>
          ) : (
            d.recent.map((g, i) => (
              <div key={i} style={css("display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #EFEEEC;font-size:13px;")}>
                <div style={css("min-width:0;")}>
                  <span style={css("font-weight:500;")}>{g.guideName || "Hardening guide"}</span>
                  <div style={css("font-size:11px;color:#a8a29e;")}>{g.userEmail || "system"}</div>
                </div>
                <span style={css("font-size:11px;font-weight:600;background:#F1F2EA;color:#0f4c9c;padding:3px 9px;border-radius:5px;flex-shrink:0;")}>{g.source.toUpperCase()}</span>
              </div>
            ))
          )}
        </div>
        <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;padding:20px;")}>
          <h3 style={css("margin:0 0 16px;font-size:15px;font-weight:600;")}>Activity</h3>
          <div style={css("font-size:12px;color:#57534E;line-height:1.7;")}>
            <div style={css("display:flex;justify-content:space-between;")}><span>Documents generated</span><b style={css("font-family:'Fragment Mono',monospace;color:#1C1917;")}>{d ? d.generations : "—"}</b></div>
            <div style={css("display:flex;justify-content:space-between;")}><span>Active subscriptions</span><b style={css("font-family:'Fragment Mono',monospace;color:#1C1917;")}>{d ? d.activeSubscriptions : "—"}</b></div>
            <div style={css("display:flex;justify-content:space-between;")}><span>Total orders</span><b style={css("font-family:'Fragment Mono',monospace;color:#1C1917;")}>{d ? d.orders : "—"}</b></div>
            <div style={css("display:flex;justify-content:space-between;")}><span>Customers</span><b style={css("font-family:'Fragment Mono',monospace;color:#1C1917;")}>{d ? d.customers : "—"}</b></div>
          </div>
          <div style={css("margin-top:18px;padding-top:14px;border-top:1px solid #EFEEEC;font-size:11.5px;color:#a8a29e;line-height:1.6;")}>Figures are live from the database. Revenue counts paid orders (Stripe); demo/simulated purchases show as $0.</div>
        </div>
      </div>
    </div>
  );
}
