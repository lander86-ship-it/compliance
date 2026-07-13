"use client";

import React from "react";
import { useHub } from "@/lib/hub/store";
import { css, fwStyle } from "@/lib/hub/theme";
import { PRODUCTS } from "@/lib/hub/data";

export function AdminCatalog() {
  const { go } = useHub();
  return (
    <div style={css("padding:26px 34px 60px;max-width:1080px;")}>
      <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;")}>
        <h1 style={css("margin:0;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>
          Catalog & pricing
        </h1>
        <button
          onClick={() => go("admin-ingest")}
          style={css("background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:10px 18px;font-size:13px;font-weight:600;cursor:pointer;")}
        >
          + New product
        </button>
      </div>
      <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;overflow:hidden;")}>
        <div
          style={css(
            "display:grid;grid-template-columns:2fr 1fr 90px 90px 110px;background:#F1F2EA;border-bottom:1px solid #E7E6E5;padding:11px 18px;font-size:11px;font-weight:600;color:#79716B;text-transform:uppercase;letter-spacing:.4px;"
          )}
        >
          <div>Product</div>
          <div>Framework</div>
          <div>Price</div>
          <div>Controls</div>
          <div>Status</div>
        </div>
        {PRODUCTS.map((p) => (
          <div
            key={p.id}
            onClick={() => go("admin-editor")}
            style={css(
              "display:grid;grid-template-columns:2fr 1fr 90px 90px 110px;padding:14px 18px;border-bottom:1px solid #EFEEEC;font-size:13px;align-items:center;cursor:pointer;"
            )}
          >
            <div style={css("font-weight:600;")}>{p.name}</div>
            <div>
              <span style={css(fwStyle(p.framework))}>{p.framework}</span>
            </div>
            <div style={css("font-family:'Fragment Mono',monospace;color:#1C1917;font-weight:600;")}>{p.price}</div>
            <div style={css("font-family:'Fragment Mono',monospace;color:#57534E;")}>{p.controls}</div>
            <div>
              <span style={css("font-size:11px;font-weight:600;color:#1f7a4d;background:#e7f4ee;padding:3px 9px;border-radius:20px;")}>
                Published
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
