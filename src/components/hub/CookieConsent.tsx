"use client";

import React from "react";
import { useHub } from "@/lib/hub/store";
import { css } from "@/lib/hub/theme";

const KEY = "hh_cookie_consent"; // "accepted" | "rejected"

// GDPR/ePrivacy cookie banner. The session cookie is strictly necessary and always set;
// this records the visitor's choice on any non-essential cookies before they are used.
export function CookieConsent() {
  const { s, go } = useHub();
  const [choice, setChoice] = React.useState<string | null>("accepted"); // default hides until read

  React.useEffect(() => {
    try { setChoice(localStorage.getItem(KEY)); } catch { setChoice("accepted"); }
  }, []);

  const decide = (value: "accepted" | "rejected") => {
    try { localStorage.setItem(KEY, value); } catch { /* ignore */ }
    setChoice(value);
  };

  if (choice === "accepted" || choice === "rejected") return null;

  const m = s.isMobile;
  return (
    <div style={css(`position:fixed;left:0;right:0;bottom:0;z-index:120;padding:${m ? "14px" : "16px 22px"};background:#1C1917;color:#F5F5F4;box-shadow:0 -6px 24px rgba(0,0,0,.18);`)}>
      <div style={css(`max-width:1120px;margin:0 auto;display:flex;gap:16px;align-items:center;${m ? "flex-direction:column;align-items:stretch;" : ""}`)}>
        <div style={css("flex:1;font-size:13px;line-height:1.6;color:#E7E5E4;")}>
          We use a strictly-necessary cookie to keep you signed in. With your consent we may use additional cookies to improve the service. See our{" "}
          <span onClick={() => go("privacy")} style={css("color:#9dc0f0;cursor:pointer;text-decoration:underline;")}>Privacy Policy</span>.
        </div>
        <div style={css(`display:flex;gap:10px;${m ? "" : "flex-shrink:0;"}`)}>
          <button onClick={() => decide("rejected")} style={css("flex:1;background:transparent;color:#E7E5E4;border:1px solid #57534E;border-radius:999px;padding:10px 18px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;")}>Reject non-essential</button>
          <button onClick={() => decide("accepted")} className="hh-primary" style={css("flex:1;background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;")}>Accept all</button>
        </div>
      </div>
    </div>
  );
}
