"use client";

import React from "react";
import { useHub } from "@/lib/hub/store";
import { css } from "@/lib/hub/theme";

// Placeholder for the compliance-frameworks catalog (NIST, ISO, PCI, SOC 2…).
// Intentionally empty for now — content is added from Admin › Catalog & pricing.
export function Frameworks() {
  const { s, go } = useHub();
  const m = s.isMobile;
  return (
    <div style={css(`max-width:1180px;${m ? "padding:20px 16px 48px;" : "padding:26px 34px 60px;"}`)}>
      <h1 style={css("margin:0 0 4px;font-size:26px;font-weight:700;letter-spacing:-.4px;")}>Frameworks</h1>
      <p style={css("margin:0 0 22px;color:#57534E;font-size:14px;")}>Compliance frameworks and policy standards.</p>
      <div style={css("background:#FBFAF9;border:1px dashed #D6D3D1;border-radius:22px;padding:60px 30px;text-align:center;")}>
        <div style={css("font-size:16px;font-weight:600;margin-bottom:6px;color:#57534E;")}>No frameworks published yet</div>
        <p style={css("margin:0 auto 20px;max-width:460px;color:#79716B;font-size:13.5px;line-height:1.6;")}>Framework standards (NIST 800-53, ISO 27001, PCI DSS, SOC 2…) will appear here once published from the Admin catalog.</p>
        <button onClick={() => go("bundles")} style={css("background:#fff;color:#0f4c9c;border:1px solid #c3d2ea;border-radius:999px;padding:10px 20px;font-size:13.5px;font-weight:600;cursor:pointer;")}>Browse bundles instead</button>
      </div>
    </div>
  );
}
