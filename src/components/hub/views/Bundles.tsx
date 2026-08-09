"use client";

import React from "react";
import { useHub } from "@/lib/hub/store";
import { css } from "@/lib/hub/theme";
import { Icon } from "../Icon";
import { BUNDLES } from "@/lib/hub/data";

export function Bundles() {
  const { s, set } = useHub();
  const m = s.isMobile;
  const allBundles = s.catalogBundles || BUNDLES;

  return (
    <div style={css(`max-width:1180px;${m ? "padding:20px 16px 48px;" : "padding:26px 34px 60px;"}`)}>
      <h1 style={css("margin:0 0 4px;font-size:26px;font-weight:700;letter-spacing:-.4px;")}>Bundles</h1>
      <p style={css("margin:0 0 22px;color:#57534E;font-size:14px;")}>Every access package. Buy one to generate CIS &amp; DISA guides for its platforms on demand.</p>

      <div style={css(`display:grid;grid-template-columns:repeat(${m ? 1 : 3},1fr);gap:18px;`)}>
        {allBundles.map((b) => (
          <div
            key={b.id}
            onClick={() => set({ view: "product", selectedId: b.id })}
            className="hh-lift"
            style={css(`background:#FBFAF9;border:1px solid ${b.featured ? "#0f4c9c" : "#E7E6E5"};border-radius:22px;padding:20px;cursor:pointer;display:flex;flex-direction:column;position:relative;box-shadow:${b.featured ? "0 6px 22px rgba(20,45,90,.10)" : "none"};`)}
          >
            {b.featured && <div style={css("position:absolute;top:-9px;left:18px;background:#E4544B;color:#fff;font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;padding:3px 9px;border-radius:20px;")}>Best value</div>}
            <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;")}>
              <span style={css("display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;font-family:'Fragment Mono',monospace;color:#0f4c9c;background:#F1F2EA;padding:3px 9px 3px 7px;border-radius:5px;")}>
                <Icon name="Bundles" size={13} />
                {b.framework === "PACK" ? "STANDARDS" : "ACCESS"}
              </span>
              <span style={css("font-size:11px;font-family:'Fragment Mono',monospace;color:#79716B;")}>{b.count} items</span>
            </div>
            <div style={css("font-size:16px;font-weight:700;line-height:1.3;margin-bottom:6px;")}>{b.name}</div>
            <div style={css("font-size:12.5px;color:#57534E;line-height:1.5;margin-bottom:14px;min-height:52px;")}>{b.tagline}</div>
            <div style={css("flex:1;")} />
            <div style={css("display:flex;justify-content:space-between;align-items:center;border-top:1px solid #EFEEEC;padding-top:12px;")}>
              <div>
                <div style={css("font-size:10px;color:#79716B;text-transform:uppercase;letter-spacing:.4px;")}>from</div>
                <div style={css("font-size:21px;font-weight:700;color:#1C1917;")}>{b.price}</div>
              </div>
              <div style={css("font-size:11px;color:#1f7a4d;font-weight:600;background:#e7f4ee;padding:3px 9px;border-radius:20px;")}>saves {b.savings}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
