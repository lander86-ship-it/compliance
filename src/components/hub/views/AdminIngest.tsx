"use client";

import React, { useState } from "react";
import { useHub } from "@/lib/hub/store";
import { css } from "@/lib/hub/theme";

type Role = { role: string; responsibilities: string[] };
type Narrative = {
  purposeIntro: string; purposeAims: string[];
  scopeIntro: string; scopeCovers: string[];
  roles: Role[];
  complianceIntro: string; complianceEnforcement: string;
};
type Draft = { title: string; aiUsed: boolean; platform: string; sections: string[]; narrative: Narrative };

export function AdminIngest() {
  const { s, set } = useHub();
  const [status, setStatus] = useState<"idle" | "gen" | "done" | "err">("idle");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [err, setErr] = useState("");
  const [dl, setDl] = useState<string | null>(null);
  const [dlBusy, setDlBusy] = useState(false);

  const run = async () => {
    setStatus("gen"); setErr(""); setDraft(null); setDl(null);
    try {
      const r = await fetch("/api/admin/ingest", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: s.aiUrl }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Generation failed");
      setDraft(d); setStatus("done");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Generation failed"); setStatus("err");
    }
  };
  const downloadDocx = async () => {
    setDlBusy(true);
    try {
      const r = await fetch("/api/admin/ingest", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: s.aiUrl, download: true }) });
      const d = await r.json();
      if (r.ok && d.url) { setDl(d.url); window.open(d.url, "_blank"); }
    } finally { setDlBusy(false); }
  };

  const card = "background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;padding:22px;margin-bottom:18px;";
  const h = "font-size:14px;font-weight:700;margin:0 0 8px;";
  const li = "font-size:13px;color:#57534E;line-height:1.6;display:flex;gap:8px;";

  return (
    <div style={css("padding:26px 34px 60px;max-width:960px;")}>
      <div style={css("display:flex;align-items:center;gap:10px;margin-bottom:4px;")}>
        <h1 style={css("margin:0;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>AI Standard Generator</h1>
        <span style={css("font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#6a2f6a;background:#f2e9f2;border:1px solid #e2cfe2;padding:3px 8px;border-radius:20px;")}>AI</span>
      </div>
      <p style={css("margin:0 0 24px;color:#57534E;font-size:14px;")}>Paste a link to a hardening guide or standard — the engine fetches it and drafts an original, framework-mapped standard for review. Nothing is published automatically.</p>

      <div style={css(card)}>
        <label style={css("font-size:12px;font-weight:600;color:#57534E;display:block;margin-bottom:7px;")}>Source URL</label>
        <div style={css("display:flex;gap:10px;flex-wrap:wrap;")}>
          <input value={s.aiUrl} onChange={(e) => set({ aiUrl: e.target.value })} placeholder="https://…" style={css("flex:1;min-width:240px;border:1px solid #E7E6E5;border-radius:8px;padding:11px 12px;font-size:13.5px;font-family:'Fragment Mono',monospace;color:#1C1917;outline:none;")} />
          <button onClick={run} disabled={status === "gen"} className="hh-primary" style={css(`background:${status === "gen" ? "#7fa4d0" : "#0f4c9c"};color:#fff;border:none;border-radius:8px;padding:0 22px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;`)}>{status === "gen" ? "Generating…" : "Generate with AI"}</button>
        </div>
      </div>

      {status === "gen" && (
        <div style={css(card + "display:flex;align-items:center;gap:12px;")}>
          <span style={css("width:20px;height:20px;border:3px solid #cdd8ea;border-top-color:#0f4c9c;border-radius:50%;animation:hh-spin .8s linear infinite;")} />
          <span style={css("font-size:13.5px;color:#57534E;")}>Fetching the source and drafting the standard…</span>
        </div>
      )}
      {status === "err" && <div style={css("border:1px solid #e6c9b8;background:#fbf3ec;border-radius:12px;padding:16px;color:#b4381f;font-size:14px;")}>{err}</div>}

      {status === "done" && draft && (
        <>
          <div style={css("background:#f0f7f3;border:1px solid #cfe0d6;border-radius:16px;padding:16px 18px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;")}>
            <div style={css("font-size:13.5px;color:#186340;")}>✓ Draft ready — <b>{draft.sections.length}</b> sections detected · {draft.aiUsed ? "AI-drafted narrative" : "structured draft (set ANTHROPIC_API_KEY for AI)"}.</div>
            <button onClick={downloadDocx} disabled={dlBusy} style={css("background:#1f7a4d;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;")}>{dlBusy ? "Building…" : dl ? "↓ Download again" : "↓ Download DOCX"}</button>
          </div>

          <div style={css(card)}>
            <div style={css("font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#79716B;font-weight:700;margin-bottom:4px;")}>Standard</div>
            <div style={css("font-size:18px;font-weight:700;margin-bottom:2px;")}>{draft.title}</div>
            <div style={css("font-size:12px;color:#79716B;")}>Platform: {draft.platform}</div>
          </div>

          <div style={css(card)}>
            <h3 style={css(h)}>1. Purpose</h3>
            <p style={css("font-size:13px;color:#57534E;line-height:1.6;margin:0 0 10px;")}>{draft.narrative.purposeIntro}</p>
            {draft.narrative.purposeAims.map((a, i) => <div key={i} style={css(li)}><span style={css("color:#1f7a4d;")}>✓</span>{a}</div>)}
          </div>
          <div style={css(card)}>
            <h3 style={css(h)}>2. Scope</h3>
            <p style={css("font-size:13px;color:#57534E;line-height:1.6;margin:0 0 10px;")}>{draft.narrative.scopeIntro}</p>
            {draft.narrative.scopeCovers.map((a, i) => <div key={i} style={css(li)}><span style={css("color:#1f7a4d;")}>✓</span>{a}</div>)}
          </div>
          <div style={css(card)}>
            <h3 style={css(h)}>3. Roles &amp; responsibilities</h3>
            {draft.narrative.roles.map((r, i) => (
              <div key={i} style={css("margin-bottom:8px;")}>
                <div style={css("font-size:13px;font-weight:600;")}>{r.role}</div>
                {r.responsibilities.map((x, j) => <div key={j} style={css(li)}><span style={css("color:#79716B;")}>·</span>{x}</div>)}
              </div>
            ))}
          </div>
          {draft.sections.length > 0 && (
            <div style={css(card)}>
              <h3 style={css(h)}>4. Control sections detected in the source</h3>
              <div style={css("display:flex;flex-wrap:wrap;gap:7px;")}>
                {draft.sections.map((sec, i) => <span key={i} style={css("font-size:12px;background:#F1F2EA;color:#1C1917;padding:4px 10px;border-radius:6px;")}>{sec}</span>)}
              </div>
            </div>
          )}
          <div style={css(card + "margin-bottom:0;")}>
            <h3 style={css(h)}>5. Compliance</h3>
            <p style={css("font-size:13px;color:#57534E;line-height:1.6;margin:0 0 8px;")}>{draft.narrative.complianceIntro}</p>
            <p style={css("font-size:13px;color:#57534E;line-height:1.6;margin:0;")}>{draft.narrative.complianceEnforcement}</p>
          </div>
        </>
      )}
    </div>
  );
}
