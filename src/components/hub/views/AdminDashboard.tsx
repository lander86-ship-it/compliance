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
  revenue30Cents: number;
  revenueDeltaPct: number | null;
  orders30: number;
  ordersDeltaPct: number | null;
  aovCents: number;
  newCustomers30: number;
  generations30: number;
  topBundles: { id: string; name: string; family: string; units: number; revenueCents: number }[];
  revenueByFamily: { family: string; revenueCents: number }[];
  genBySource: Record<string, number>;
  recent: { source: string; guideName: string | null; userEmail: string | null; createdAt: string }[];
};

function money(cents: number, currency: string): string {
  const sym = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${sym}${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
const FAMILY_LABEL: Record<string, string> = { hardening: "Hardening guides", standards: "Standards & policies", other: "Other" };
const SOURCE_LABEL: Record<string, string> = { cis: "CIS", disa: "DISA STIG", policy: "Policy standard", baked: "Sample / trial" };
const SOURCE_COLOR: Record<string, string> = { cis: "#0f4c9c", disa: "#1f6a4d", policy: "#6a2f6a", baked: "#b5721c" };

// Small green/red delta pill vs. the previous 30 days.
function Delta({ pct }: { pct: number | null }) {
  if (pct === null) return <span style={css("font-size:11px;color:#a8a29e;")}>—</span>;
  const up = pct >= 0;
  return <span style={css(`font-size:11px;font-weight:600;color:${up ? "#1f7a4d" : "#b4381f"};`)}>{up ? "▲" : "▼"} {Math.abs(pct)}%</span>;
}

export function AdminDashboard() {
  const { s } = useHub();
  const m = s.isMobile;
  const [d, setD] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => (r.ok ? r.json() : null)).then((x) => x && setD(x)).catch(() => {});
  }, []);

  const cur = d?.currency || "USD";
  const kpis = [
    { k: "Revenue · 30d", v: d ? money(d.revenue30Cents, cur) : "—", delta: d?.revenueDeltaPct ?? null, sub: d ? `${money(d.revenueCents, cur)} all-time` : "" },
    { k: "Orders · 30d", v: d ? String(d.orders30) : "—", delta: d?.ordersDeltaPct ?? null, sub: d ? `${d.orders} all-time` : "" },
    { k: "Avg. order value", v: d ? money(d.aovCents, cur) : "—", delta: null, sub: "paid orders" },
    { k: "Customers", v: d ? String(d.customers) : "—", delta: null, sub: d ? `+${d.newCustomers30} in 30d` : "" },
  ];

  const maxBundleRev = Math.max(1, ...(d?.topBundles || []).map((b) => b.revenueCents));
  const familyTotal = Math.max(1, (d?.revenueByFamily || []).reduce((a, b) => a + b.revenueCents, 0));
  const genEntries = Object.entries(d?.genBySource || {}).sort((a, b) => b[1] - a[1]);
  const genTotal = Math.max(1, genEntries.reduce((a, [, n]) => a + n, 0));

  const card = "background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;padding:20px;";

  return (
    <div style={css(`max-width:1180px;${m ? "padding:18px 14px 48px;" : "padding:26px 34px 60px;"}`)}>
      <h1 style={css("margin:0 0 22px;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>Dashboard</h1>

      {/* KPI row */}
      <div style={css(`display:grid;grid-template-columns:repeat(${m ? 2 : 4},1fr);gap:16px;margin-bottom:18px;`)}>
        {kpis.map((k) => (
          <div key={k.k} style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:20px;padding:18px;")}>
            <div style={css("font-size:12px;color:#79716B;margin-bottom:8px;")}>{k.k}</div>
            <div style={css("display:flex;align-items:baseline;gap:8px;")}>
              <div style={css("font-size:24px;font-weight:700;color:#1C1917;letter-spacing:-.5px;font-family:'Fragment Mono',monospace;")}>{k.v}</div>
              <Delta pct={k.delta} />
            </div>
            <div style={css("font-size:11px;color:#a8a29e;margin-top:5px;")}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={css(`display:grid;grid-template-columns:${m ? "1fr" : "1.4fr 1fr"};gap:18px;margin-bottom:18px;`)}>
        {/* Top bundles by revenue */}
        <div style={css(card)}>
          <h3 style={css("margin:0 0 16px;font-size:15px;font-weight:600;")}>Top bundles by revenue</h3>
          {!d ? <div style={css("color:#79716B;font-size:13px;")}>Loading…</div>
            : d.topBundles.length === 0 ? <div style={css("color:#79716B;font-size:13px;")}>No paid orders yet.</div>
            : d.topBundles.map((b) => (
              <div key={b.id} style={css("margin-bottom:12px;")}>
                <div style={css("display:flex;justify-content:space-between;align-items:baseline;font-size:13px;margin-bottom:5px;gap:10px;")}>
                  <span style={css("font-weight:500;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;")}>{b.name}</span>
                  <span style={css("font-family:'Fragment Mono',monospace;font-weight:600;color:#1C1917;flex-shrink:0;")}>{money(b.revenueCents, cur)}</span>
                </div>
                <div style={css("height:8px;background:#EFEEEC;border-radius:99px;overflow:hidden;")}>
                  <div style={css(`height:100%;width:${Math.round((b.revenueCents / maxBundleRev) * 100)}%;background:#0f4c9c;border-radius:99px;`)} />
                </div>
                <div style={css("font-size:11px;color:#a8a29e;margin-top:3px;")}>{b.units} order{b.units === 1 ? "" : "s"}</div>
              </div>
            ))}
        </div>

        {/* Revenue by family */}
        <div style={css(card)}>
          <h3 style={css("margin:0 0 16px;font-size:15px;font-weight:600;")}>Revenue by line</h3>
          {!d ? <div style={css("color:#79716B;font-size:13px;")}>Loading…</div>
            : d.revenueByFamily.length === 0 ? <div style={css("color:#79716B;font-size:13px;")}>No paid orders yet.</div>
            : d.revenueByFamily.map((f) => {
              const pct = Math.round((f.revenueCents / familyTotal) * 100);
              return (
                <div key={f.family} style={css("margin-bottom:14px;")}>
                  <div style={css("display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px;")}>
                    <span>{FAMILY_LABEL[f.family] || f.family}</span>
                    <span style={css("font-family:'Fragment Mono',monospace;font-weight:600;")}>{money(f.revenueCents, cur)} · {pct}%</span>
                  </div>
                  <div style={css("height:8px;background:#EFEEEC;border-radius:99px;overflow:hidden;")}>
                    <div style={css(`height:100%;width:${pct}%;background:#1f6a4d;border-radius:99px;`)} />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div style={css(`display:grid;grid-template-columns:${m ? "1fr" : "1.4fr 1fr"};gap:18px;`)}>
        {/* Recent generations */}
        <div style={css(card)}>
          <h3 style={css("margin:0 0 16px;font-size:15px;font-weight:600;")}>Recent generations</h3>
          {!d ? <div style={css("color:#79716B;font-size:13px;")}>Loading…</div>
            : d.recent.length === 0 ? <div style={css("color:#79716B;font-size:13px;")}>No guides generated yet.</div>
            : d.recent.map((g, i) => (
              <div key={i} style={css("display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #EFEEEC;font-size:13px;")}>
                <div style={css("min-width:0;")}>
                  <span style={css("font-weight:500;")}>{g.guideName || "Hardening guide"}</span>
                  <div style={css("font-size:11px;color:#a8a29e;")}>{g.userEmail || "system"}</div>
                </div>
                <span style={css(`font-size:11px;font-weight:600;background:#F1F2EA;color:${SOURCE_COLOR[g.source] || "#0f4c9c"};padding:3px 9px;border-radius:5px;flex-shrink:0;`)}>{(SOURCE_LABEL[g.source] || g.source).toUpperCase()}</span>
              </div>
            ))}
        </div>

        {/* Generations by source + totals */}
        <div style={css(card)}>
          <h3 style={css("margin:0 0 16px;font-size:15px;font-weight:600;")}>Generations by source</h3>
          {!d ? <div style={css("color:#79716B;font-size:13px;")}>Loading…</div>
            : genEntries.length === 0 ? <div style={css("color:#79716B;font-size:13px;")}>No guides generated yet.</div>
            : genEntries.map(([src, n]) => {
              const pct = Math.round((n / genTotal) * 100);
              return (
                <div key={src} style={css("margin-bottom:12px;")}>
                  <div style={css("display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px;")}>
                    <span>{SOURCE_LABEL[src] || src}</span>
                    <span style={css("font-family:'Fragment Mono',monospace;font-weight:600;")}>{n}</span>
                  </div>
                  <div style={css("height:8px;background:#EFEEEC;border-radius:99px;overflow:hidden;")}>
                    <div style={css(`height:100%;width:${pct}%;background:${SOURCE_COLOR[src] || "#0f4c9c"};border-radius:99px;`)} />
                  </div>
                </div>
              );
            })}
          <div style={css("margin-top:16px;padding-top:14px;border-top:1px solid #EFEEEC;font-size:12px;color:#57534E;line-height:1.8;")}>
            <div style={css("display:flex;justify-content:space-between;")}><span>Documents · 30d</span><b style={css("font-family:'Fragment Mono',monospace;color:#1C1917;")}>{d ? d.generations30 : "—"}</b></div>
            <div style={css("display:flex;justify-content:space-between;")}><span>Documents · all-time</span><b style={css("font-family:'Fragment Mono',monospace;color:#1C1917;")}>{d ? d.generations : "—"}</b></div>
            <div style={css("display:flex;justify-content:space-between;")}><span>Active subscriptions</span><b style={css("font-family:'Fragment Mono',monospace;color:#1C1917;")}>{d ? d.activeSubscriptions : "—"}</b></div>
          </div>
          <div style={css("margin-top:14px;font-size:11px;color:#a8a29e;line-height:1.6;")}>Live from the database. Revenue counts paid Stripe/PO orders; demo purchases show as $0.</div>
        </div>
      </div>
    </div>
  );
}
