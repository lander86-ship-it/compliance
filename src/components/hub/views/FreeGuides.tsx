"use client";

import React, { useEffect, useState } from "react";
import { useHub } from "@/lib/hub/store";
import { css, statusPill } from "@/lib/hub/theme";
import { Icon } from "../Icon";

type Art = { format: string; url: string; bytes: number };

// Guests may generate one trial document per browser session (no account). The
// "used" flag lives in sessionStorage, so it resets when the tab session ends —
// exactly "once without leaving the session". Signing up lifts the limit.
const TRIAL_KEY = "hh_trial_used";

type Kind = "hardening" | "standard";
const KINDS: { id: Kind; label: string; desc: string; productId: string; formats: string[] }[] = [
  { id: "hardening", label: "Hardening guide (CIS sample)", desc: "A full CIS-style hardening baseline with controls, rationale and cross-mappings.", productId: "cis-win2022", formats: ["DOCX", "PDF"] },
  { id: "standard", label: "Policy standard (sample)", desc: "An editable security policy standard drafted from the same engine as the paid ones.", productId: "cis-win2022", formats: ["POLICY"] },
];

export function FreeGuides() {
  const { s, go } = useHub();
  const [used, setUsed] = useState(false);
  const [company, setCompany] = useState("");
  const [kind, setKind] = useState<Kind>("hardening");
  const [status, setStatus] = useState<"idle" | "gen" | "done" | "err">("idle");
  const [arts, setArts] = useState<Art[]>([]);
  const [err, setErr] = useState("");

  const signedIn = s.authStatus === "authed";

  useEffect(() => {
    try { setUsed(sessionStorage.getItem(TRIAL_KEY) === "1"); } catch { /* ignore */ }
  }, []);

  const generate = async () => {
    setStatus("gen"); setErr("");
    const chosen = KINDS.find((k) => k.id === kind)!;
    const legal = company.trim() || "Your Company";
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId: chosen.productId,
          scope: { legal, trade: legal, owner: `${legal} Security`, profile: "Level 1", classification: "Trial sample" },
          formats: chosen.formats,
        }),
      });
      if (!r.ok) throw new Error(`Generation failed (${r.status})`);
      const d = await r.json();
      setArts(d.artifacts || []);
      setStatus("done");
      // Guests are limited to one trial per session; signed-in users are not.
      if (!signedIn) { try { sessionStorage.setItem(TRIAL_KEY, "1"); } catch { /* ignore */ } setUsed(true); }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Generation failed");
      setStatus("err");
    }
  };

  const artChip = "font-size:12px;font-family:'Fragment Mono',monospace;background:#F1F2EA;color:#0f4c9c;padding:6px 12px;border-radius:6px;font-weight:600;text-decoration:none;";
  const locked = used && !signedIn && status !== "done";

  return (
    <div style={css("max-width:820px;padding:26px 34px 60px;")}>
      <h1 style={css("margin:0 0 4px;font-size:26px;font-weight:700;letter-spacing:-.4px;")}>Try it free</h1>
      <p style={css("margin:0 0 22px;color:#57534E;font-size:14px;")}>Generate one complete sample document as a guest — no account required.{!signedIn ? " One trial per session." : ""}</p>

      <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;padding:24px;")}>
        <div style={css("display:flex;align-items:center;gap:10px;margin-bottom:16px;")}>
          <span style={css("display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;font-family:'Fragment Mono',monospace;color:#1f7a4d;background:#e7f4ee;padding:3px 10px;border-radius:5px;")}><Icon name="shield" size={13} /> FREE TRIAL</span>
          {!signedIn && <span style={css(statusPill(used ? "#b5721c" : "#0f4c9c"))}>{used ? "Trial used this session" : "1 free generation"}</span>}
        </div>

        {locked ? (
          <div>
            <div style={css("font-size:15px;font-weight:600;margin-bottom:8px;")}>You&apos;ve used your free trial for this session.</div>
            <p style={css("margin:0 0 18px;color:#57534E;font-size:13.5px;line-height:1.6;")}>Create a free account to generate real guides and standards with your own template and keep them in your Library.</p>
            <button onClick={() => go("auth")} className="hh-primary" style={css("background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer;")}>Create an account</button>
          </div>
        ) : status === "done" ? (
          <div>
            <div style={css("font-size:13px;color:#186340;font-weight:600;margin-bottom:10px;")}>✓ Your sample is ready — download below.</div>
            <div style={css("display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px;")}>
              {arts.map((a) => (<a key={a.format} href={a.url} style={css(artChip)}>↓ {a.format.replace("POLICY", "DOCX")}</a>))}
            </div>
            <div style={css("border-top:1px solid #EFEEEC;padding-top:16px;font-size:13px;color:#57534E;line-height:1.6;")}>
              Want to generate real guides with your own branding and template?{" "}
              <span onClick={() => go(signedIn ? "generator" : "auth")} style={css("color:#0f4c9c;font-weight:600;cursor:pointer;")}>{signedIn ? "Go to the generator" : "Create a free account"}</span>.
            </div>
          </div>
        ) : (
          <>
            <label style={css("display:block;font-size:12px;font-weight:600;color:#57534E;margin-bottom:6px;")}>Your company name</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme, S.L." style={css("width:100%;box-sizing:border-box;border:1px solid #D6D3D1;border-radius:10px;padding:11px 13px;font-size:14px;margin-bottom:16px;")} />

            <label style={css("display:block;font-size:12px;font-weight:600;color:#57534E;margin-bottom:8px;")}>What do you want to try?</label>
            <div style={css("display:flex;flex-direction:column;gap:8px;margin-bottom:20px;")}>
              {KINDS.map((k) => {
                const on = kind === k.id;
                return (
                  <button key={k.id} onClick={() => setKind(k.id)} style={css(`text-align:left;background:${on ? "#eef3fb" : "#fff"};border:1px solid ${on ? "#0f4c9c" : "#E7E6E5"};border-radius:12px;padding:12px 14px;cursor:pointer;`)}>
                    <div style={css(`font-size:14px;font-weight:600;color:#1C1917;margin-bottom:2px;`)}>{k.label}</div>
                    <div style={css("font-size:12.5px;color:#57534E;line-height:1.5;")}>{k.desc}</div>
                  </button>
                );
              })}
            </div>

            <button onClick={generate} disabled={status === "gen"} className="hh-primary" style={css(`background:${status === "gen" ? "#7fa4d0" : "#0f4c9c"};color:#fff;border:none;border-radius:999px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer;`)}>
              {status === "gen" ? "Generating…" : "Generate my free sample"}
            </button>
            {status === "err" && <div style={css("margin-top:12px;font-size:13px;color:#8a3b3b;")}>{err}</div>}
          </>
        )}
      </div>
    </div>
  );
}
