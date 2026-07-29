"use client";

import React from "react";
import { css } from "@/lib/hub/theme";
import { KPIS, TOP_PRODUCTS, REV_BY_FW } from "@/lib/hub/data";
import { useHub } from "@/lib/hub/store";

export function AdminDashboard() {
  const { s } = useHub();
  const m = s.isMobile;
  return (
    <div style={css(`max-width:1180px;${m ? "padding:18px 14px 48px;" : "padding:26px 34px 60px;"}`)}>
      <h1 style={css("margin:0 0 22px;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>
        Dashboard
      </h1>
      <div style={css(`display:grid;grid-template-columns:repeat(${m ? 2 : 4},1fr);gap:16px;margin-bottom:22px;`)}>
        {KPIS.map((k) => (
          <div key={k.k} style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:20px;padding:18px;")}>
            <div style={css("font-size:12px;color:#79716B;margin-bottom:8px;")}>{k.k}</div>
            <div style={css("font-size:26px;font-weight:700;color:#1C1917;letter-spacing:-.5px;font-family:'Fragment Mono',monospace;")}>
              {k.v}
            </div>
            <div style={css(`font-size:12px;font-weight:600;margin-top:6px;color:${k.deltaColor};`)}>
              {k.d} vs prev.
            </div>
          </div>
        ))}
      </div>
      <div style={css(`display:grid;grid-template-columns:${m ? "1fr" : "1.6fr 1fr"};gap:18px;`)}>
        <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;padding:20px;")}>
          <h3 style={css("margin:0 0 16px;font-size:15px;font-weight:600;")}>Best-selling products</h3>
          {TOP_PRODUCTS.map((p) => (
            <div key={p.name} style={css("margin-bottom:14px;")}>
              <div style={css("display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;")}>
                <span style={css("font-weight:500;")}>{p.name}</span>
                <span style={css("font-family:'Fragment Mono',monospace;color:#57534E;")}>
                  {p.rev} · {p.units}u
                </span>
              </div>
              <div style={css("height:8px;background:#EFEEEC;border-radius:6px;overflow:hidden;")}>
                <div style={css(`height:100%;width:${p.pct}%;background:linear-gradient(90deg,#0f4c9c,#2f86e6);border-radius:6px;`)}></div>
              </div>
            </div>
          ))}
        </div>
        <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;padding:20px;")}>
          <h3 style={css("margin:0 0 16px;font-size:15px;font-weight:600;")}>Revenue by framework</h3>
          {REV_BY_FW.map((r) => (
            <div key={r.fw} style={css("margin-bottom:16px;")}>
              <div style={css("display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;")}>
                <span style={css("font-weight:500;")}>{r.fw}</span>
                <span style={css("font-family:'Fragment Mono',monospace;color:#57534E;")}>{r.pct}%</span>
              </div>
              <div style={css("height:8px;background:#EFEEEC;border-radius:6px;overflow:hidden;")}>
                <div style={css(`height:100%;width:${r.pct}%;background:${r.c};border-radius:6px;`)}></div>
              </div>
            </div>
          ))}
          <div style={css("margin-top:22px;padding-top:16px;border-top:1px solid #EFEEEC;font-size:12px;color:#57534E;line-height:1.7;")}>
            <div style={css("display:flex;justify-content:space-between;")}>
              <span>Active subscriptions</span>
              <b style={css("font-family:'Fragment Mono',monospace;color:#1C1917;")}>214</b>
            </div>
            <div style={css("display:flex;justify-content:space-between;")}>
              <span>Coupons redeemed (30d)</span>
              <b style={css("font-family:'Fragment Mono',monospace;color:#1C1917;")}>37</b>
            </div>
            <div style={css("display:flex;justify-content:space-between;")}>
              <span>Documents generated</span>
              <b style={css("font-family:'Fragment Mono',monospace;color:#1C1917;")}>1,842</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
