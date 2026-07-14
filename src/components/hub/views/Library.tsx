"use client";

import React from "react";
import { useHub } from "@/lib/hub/store";
import { css, statusPill } from "@/lib/hub/theme";
import { LIBRARY_ITEMS } from "@/lib/hub/data";

export function Library() {
  const { s, configure } = useHub();
  const artChip = "font-size:11px;font-family:'Fragment Mono',monospace;background:#F1F2EA;color:#0f4c9c;padding:3px 9px;border-radius:5px;font-weight:600;cursor:pointer;";

  return (
    <div style={css("padding:26px 34px 60px;max-width:1080px;")}>
      {s.justOrdered && (
        <div style={css("background:#f0f7f3;border:1px solid #cfe0d6;border-radius:9px;padding:14px 18px;margin-bottom:20px;font-size:13.5px;color:#186340;")}>✓ Order confirmed. Your invoice has been emailed. Configure each product to generate documents.</div>
      )}
      <div style={css("display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:22px;")}>
        <div>
          <h1 style={css("margin:0;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>Library</h1>
          <p style={css("margin:6px 0 0;color:#57534E;font-size:14px;")}>Purchased products, licenses, and generated documents.</p>
        </div>
      </div>
      <div style={css("display:flex;flex-direction:column;gap:14px;")}>
        {LIBRARY_ITEMS.map((it) => {
          // Wire real artifacts produced by the generation engine onto the matching product.
          const real = it.productId === s.wizardProductId && s.genArtifacts.length > 0 ? s.genArtifacts : null;
          const artifacts = real ? real.map((a) => a.format) : it.artifacts;
          const status = real ? "Ready" : it.status;
          const statusColor = real ? "#1f7a4d" : it.statusColor;
          return (
            <div key={it.name} style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:20px;padding:20px;display:flex;align-items:center;gap:18px;")}>
              <div style={css("width:46px;height:46px;border-radius:9px;background:#F1F2EA;display:flex;align-items:center;justify-content:center;font-family:'Fragment Mono',monospace;font-weight:600;color:#0f4c9c;font-size:12px;flex-shrink:0;")}>{it.fw}</div>
              <div style={css("flex:1;min-width:0;")}>
                <div style={css("display:flex;align-items:center;gap:10px;")}>
                  <span style={css("font-size:15px;font-weight:600;")}>{it.name}</span>
                  <span style={css(statusPill(statusColor))}>{status}</span>
                </div>
                <div style={css("font-size:12px;color:#79716B;font-family:'Fragment Mono',monospace;margin-top:4px;")}>{it.version} · one-organization license · {it.gens}</div>
                <div style={css("display:flex;gap:8px;margin-top:10px;")}>
                  {artifacts.map((a, i) =>
                    real ? (
                      <a key={a} href={real[i].url} style={css(artChip + "text-decoration:none;")}>↓ {a}</a>
                    ) : (
                      <span key={a} style={css(artChip)}>↓ {a}</span>
                    ),
                  )}
                </div>
              </div>
              <button onClick={() => configure(it.productId)} className="hh-primary" style={css("background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:10px 18px;font-size:13px;font-weight:600;cursor:pointer;flex-shrink:0;")}>Configure &amp; generate</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
