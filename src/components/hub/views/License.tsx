"use client";

import React from "react";
import { css } from "@/lib/hub/theme";

export function License() {
  return (
    <div style={css("padding:26px 34px 60px;max-width:900px;")}>
      <h1 style={css("margin:0 0 6px;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>
        Licenses
      </h1>
      <p style={css("margin:0 0 22px;color:#57534E;font-size:14px;")}>
        Per-product license terms, generation limits, and update subscriptions.
      </p>
      <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;overflow:hidden;")}>
        <div
          style={css(
            "display:grid;grid-template-columns:2fr 1fr 1fr 1fr;background:#F1F2EA;border-bottom:1px solid #E7E6E5;padding:11px 18px;font-size:11px;font-weight:600;color:#79716B;text-transform:uppercase;letter-spacing:.4px;"
          )}
        >
          <div>Product</div>
          <div>License type</div>
          <div>Generations</div>
          <div>Updates</div>
        </div>
        <div
          style={css(
            "display:grid;grid-template-columns:2fr 1fr 1fr 1fr;padding:15px 18px;border-bottom:1px solid #EFEEEC;font-size:13px;align-items:center;"
          )}
        >
          <div style={css("font-weight:600;")}>CIS Windows Server 2022</div>
          <div style={css("color:#57534E;")}>One organization</div>
          <div style={css("font-family:'Fragment Mono',monospace;color:#57534E;")}>2 / 5</div>
          <div>
            <span style={css("font-size:11px;font-weight:600;color:#1f7a4d;background:#e7f4ee;padding:3px 9px;border-radius:20px;")}>
              Active
            </span>
          </div>
        </div>
        <div
          style={css(
            "display:grid;grid-template-columns:2fr 1fr 1fr 1fr;padding:15px 18px;border-bottom:1px solid #EFEEEC;font-size:13px;align-items:center;"
          )}
        >
          <div style={css("font-weight:600;")}>CIS Ubuntu 22.04 LTS</div>
          <div style={css("color:#57534E;")}>One organization</div>
          <div style={css("font-family:'Fragment Mono',monospace;color:#57534E;")}>0 / 5</div>
          <div>
            <span style={css("font-size:11px;font-weight:600;color:#1f7a4d;background:#e7f4ee;padding:3px 9px;border-radius:20px;")}>
              Active
            </span>
          </div>
        </div>
        <div
          style={css(
            "display:grid;grid-template-columns:2fr 1fr 1fr 1fr;padding:15px 18px;font-size:13px;align-items:center;"
          )}
        >
          <div style={css("font-weight:600;")}>DISA STIG — RHEL 9</div>
          <div style={css("color:#57534E;")}>One organization</div>
          <div style={css("font-family:'Fragment Mono',monospace;color:#57534E;")}>1 / 5</div>
          <div>
            <span style={css("font-size:11px;font-weight:600;color:#b5721c;background:#f6efe4;padding:3px 9px;border-radius:20px;")}>
              Expires 30d
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
