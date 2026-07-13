"use client";

import React from "react";
import { css } from "@/lib/hub/theme";
import { DIFF_ROWS } from "@/lib/hub/data";

export function AdminVersioning() {
  return (
    <div style={css("padding:26px 34px 60px;max-width:920px;")}>
      <h1 style={css("margin:0 0 4px;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>
        Versioning & updates
      </h1>
      <p style={css("margin:0 0 22px;color:#57534E;font-size:14px;")}>
        Publishing <b>CIS Windows Server 2022 v2.0.0 → v2.1.0</b>. Review the control diff before notifying subscribers.
      </p>
      <div style={css("display:flex;flex-direction:column;gap:12px;margin-bottom:24px;")}>
        {DIFF_ROWS.map((d) => (
          <div
            key={d.label}
            style={css(
              "display:flex;align-items:center;gap:14px;background:#FBFAF9;border:1px solid #E7E6E5;border-radius:16px;padding:16px 18px;"
            )}
          >
            <span
              style={css(
                `font-size:12px;font-weight:700;font-family:'Fragment Mono',monospace;color:${d.c};background:${d.c}14;width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;`
              )}
            >
              {d.sign}
            </span>
            <div style={css("flex:1;")}>
              <div style={css("font-size:14px;font-weight:600;")}>
                {d.label} — {d.items}
              </div>
              <div style={css("font-size:12.5px;color:#57534E;margin-top:2px;")}>{d.note}</div>
            </div>
          </div>
        ))}
      </div>
      <div
        style={css(
          "background:#F1F2EA;border:1px solid #E7E6E5;border-radius:16px;padding:18px 20px;display:flex;justify-content:space-between;align-items:center;"
        )}
      >
        <div style={css("font-size:13px;color:#0f4c9c;")}>
          <b>214 subscribers</b> will be notified. Previous version stays available to prior purchasers.
        </div>
        <button
          style={css(
            "background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:11px 22px;font-size:14px;font-weight:600;cursor:pointer;flex-shrink:0;"
          )}
        >
          Publish & notify
        </button>
      </div>
    </div>
  );
}
