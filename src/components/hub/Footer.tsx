"use client";

import React from "react";
import { useHub } from "@/lib/hub/store";
import { css } from "@/lib/hub/theme";

// Global footer with legal links, shown under every view.
export function Footer() {
  const { s, go } = useHub();
  const link = "color:#57534E;font-size:12.5px;cursor:pointer;";
  const resetConsent = () => { try { localStorage.removeItem("hh_cookie_consent"); } catch { /* ignore */ } location.reload(); };
  return (
    <footer style={css(`border-top:1px solid #E7E6E5;margin-top:20px;padding:${s.isMobile ? "18px 16px 28px" : "20px 34px 34px"};background:#FBFAF9;`)}>
      <div style={css("max-width:1180px;margin:0 auto;display:flex;gap:18px;flex-wrap:wrap;align-items:center;")}>
        <span style={css("font-size:12.5px;color:#79716B;")}>© {2026} HardenHub</span>
        <span onClick={() => go("terms")} style={css(link)}>Terms</span>
        <span onClick={() => go("privacy")} style={css(link)}>Privacy</span>
        <span onClick={resetConsent} style={css(link)}>Cookie settings</span>
      </div>
    </footer>
  );
}
