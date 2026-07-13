"use client";

import React from "react";
import { css, statusPill } from "@/lib/hub/theme";
import { ORDERS } from "@/lib/hub/data";

export function AdminOrders() {
  return (
    <div style={css("padding:26px 34px 60px;max-width:980px;")}>
      <h1 style={css("margin:0 0 22px;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>
        Orders
      </h1>
      <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;overflow:hidden;")}>
        <div
          style={css(
            "display:grid;grid-template-columns:120px 1fr 120px 130px 80px;background:#F1F2EA;border-bottom:1px solid #E7E6E5;padding:11px 18px;font-size:11px;font-weight:600;color:#79716B;text-transform:uppercase;letter-spacing:.4px;"
          )}
        >
          <div>Order</div>
          <div>Organization</div>
          <div>Total</div>
          <div>Status</div>
          <div></div>
        </div>
        {ORDERS.map((o) => (
          <div
            key={o.id}
            style={css(
              "display:grid;grid-template-columns:120px 1fr 120px 130px 80px;padding:14px 18px;border-bottom:1px solid #EFEEEC;font-size:13px;align-items:center;"
            )}
          >
            <div style={css("font-family:'Fragment Mono',monospace;font-weight:600;color:#1C1917;")}>{o.id}</div>
            <div>{o.org}</div>
            <div style={css("font-family:'Fragment Mono',monospace;color:#1C1917;font-weight:600;")}>{o.total}</div>
            <div>
              <span style={css(statusPill(o.c))}>{o.status}</span>
            </div>
            <div style={css("text-align:right;")}>
              <span style={css("color:#1663d6;font-size:12px;cursor:pointer;")}>View</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
