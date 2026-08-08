"use client";

import React, { useEffect } from "react";
import { useHub } from "@/lib/hub/store";
import { css, statusPill } from "@/lib/hub/theme";

const SOURCE_LABEL: Record<string, string> = { cis: "CIS Benchmarks", disa: "DISA STIGs" };

export function Subscriptions() {
  const { s, go, loadPurchases } = useHub();

  useEffect(() => {
    if (s.purchasesStatus === "idle") loadPurchases();
  }, [s.purchasesStatus, loadPurchases]);

  // Flatten purchases into the distinct bundles the buyer can generate with.
  const owned = new Map<string, { name: string; sources: string[]; categories: string[]; since: string }>();
  for (const p of s.purchases || []) {
    for (const b of p.bundles) {
      if (!owned.has(b.id)) owned.set(b.id, { name: b.name, sources: b.sources, categories: b.categories, since: p.createdAt });
    }
  }
  const subs = [...owned.values()];
  const loading = s.purchasesStatus === "loading" || s.purchasesStatus === "idle";
  const isAdmin = s.entAdmin;

  return (
    <div style={css("padding:26px 34px 60px;max-width:1000px;")}>
      <h1 style={css("margin:0 0 6px;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>Subscriptions</h1>
      <p style={css("margin:0 0 22px;color:#57534E;font-size:14px;")}>The access bundles you own. Each lets you generate CIS and DISA guides on demand for its platforms.</p>

      {isAdmin && (
        <div style={css("background:#eef4fb;border:1px solid #cfe0f2;border-radius:12px;padding:14px 18px;margin-bottom:20px;font-size:13.5px;color:#0f4c9c;")}>
          You are signed in as an administrator — you can generate any CIS or DISA guide without a subscription.
        </div>
      )}

      {loading ? (
        <div style={css("color:#79716B;font-size:14px;padding:40px 0;")}>Loading your subscriptions…</div>
      ) : subs.length === 0 ? (
        <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:20px;padding:44px;text-align:center;")}>
          <div style={css("font-size:15px;font-weight:600;margin-bottom:6px;")}>No active subscriptions yet</div>
          <p style={css("margin:0 0 18px;color:#79716B;font-size:13.5px;")}>Purchase an access bundle to start generating hardening guides.</p>
          <button onClick={() => go("storefront")} className="hh-primary" style={css("background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:11px 22px;font-size:13.5px;font-weight:600;cursor:pointer;")}>Browse bundles</button>
        </div>
      ) : (
        <div style={css("display:flex;flex-direction:column;gap:14px;")}>
          {subs.map((b, i) => (
            <div key={i} style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:20px;padding:20px 22px;")}>
              <div style={css("display:flex;align-items:center;gap:10px;flex-wrap:wrap;")}>
                <span style={css("font-size:16px;font-weight:600;")}>{b.name}</span>
                <span style={css(statusPill("#1f7a4d"))}>Active</span>
              </div>
              <div style={css("display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;")}>
                {(b.sources.length ? b.sources : ["cis", "disa"]).map((src) => (
                  <span key={src} style={css("font-size:11.5px;font-weight:600;background:#F1F2EA;color:#0f4c9c;padding:4px 10px;border-radius:6px;")}>{SOURCE_LABEL[src] || src.toUpperCase()}</span>
                ))}
                {(b.categories.length ? b.categories : ["All platforms"]).map((c) => (
                  <span key={c} style={css("font-size:11.5px;background:#f6f5f3;color:#57534E;border:1px solid #E7E6E5;padding:4px 10px;border-radius:6px;")}>{c}</span>
                ))}
              </div>
              <div style={css("display:flex;justify-content:space-between;align-items:center;margin-top:14px;")}>
                <span style={css("font-size:12px;color:#79716B;font-family:'Fragment Mono',monospace;")}>Since {new Date(b.since).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                <button onClick={() => go("generator")} className="hh-primary" style={css("background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;")}>Generate a guide</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
