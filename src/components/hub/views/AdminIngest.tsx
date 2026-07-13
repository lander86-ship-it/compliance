"use client";

import React from "react";
import { useHub } from "@/lib/hub/store";
import { css, sevStyle } from "@/lib/hub/theme";
import { AI_STAGES, WIZ_CONTROLS } from "@/lib/hub/data";

export function AdminIngest() {
  const { s, set, runAI, resetAI } = useHub();
  const st = s.aiStatus;
  const cur = s.aiStage;
  const ingestRows = WIZ_CONTROLS.slice(0, 7).map((c, i) => ({ ...c, conf: i % 4 === 0 ? "Review" : "AI draft", review: i % 4 === 0 }));

  return (
    <div style={css("padding:26px 34px 60px;max-width:960px;")}>
      <div style={css("display:flex;align-items:center;gap:10px;margin-bottom:4px;")}>
        <h1 style={css("margin:0;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>AI Standard Generator</h1>
        <span style={css("font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#6a2f6a;background:#f2e9f2;border:1px solid #e2cfe2;padding:3px 8px;border-radius:20px;")}>AI</span>
      </div>
      <p style={css("margin:0 0 24px;color:#57534E;font-size:14px;")}>Paste a link to a benchmark, STIG or standard — the engine fetches it and drafts an original, framework-mapped product for review. Nothing is published automatically.</p>

      <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;padding:22px;margin-bottom:22px;")}>
        <label style={css("font-size:12px;font-weight:600;color:#57534E;display:block;margin-bottom:7px;")}>Source URL or reference</label>
        <div style={css("display:flex;gap:10px;margin-bottom:16px;")}>
          <div style={css("flex:1;display:flex;align-items:center;gap:8px;border:1px solid #E7E6E5;border-radius:8px;padding:0 12px;background:#FBFAF9;")}>
            <span style={css("font-family:'Fragment Mono',monospace;color:#79716B;font-size:13px;")}>↗</span>
            <input value={s.aiUrl} onChange={(e) => set({ aiUrl: e.target.value })} placeholder="https://…" style={css("flex:1;border:none;background:transparent;outline:none;padding:11px 0;font-size:13.5px;font-family:'Fragment Mono',monospace;color:#1C1917;")} />
          </div>
          <button onClick={() => runAI()} className="hh-primary" style={css("background:#0f4c9c;color:#fff;border:none;border-radius:8px;padding:0 22px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;")}>Generate with AI</button>
        </div>
        <div style={css("display:flex;gap:20px;flex-wrap:wrap;font-size:12px;color:#79716B;")}>
          <span>Also accepts:</span>
          {["XCCDF/SCAP", "OSCAL/JSON", "Excel/CSV", "PDF (assisted)"].map((f) => (
            <span key={f} style={css("font-family:'Fragment Mono',monospace;")}>{f}</span>
          ))}
        </div>
      </div>

      {st === "idle" && (
        <div style={css("border:1px dashed #D8D6D3;border-radius:22px;padding:40px;text-align:center;background:repeating-linear-gradient(45deg,#f7f9fc,#f7f9fc 12px,#f3f6fa 12px,#f3f6fa 24px);")}>
          <div style={css("font-size:15px;font-weight:600;color:#57534E;margin-bottom:6px;")}>Ready to generate</div>
          <div style={css("font-size:13px;color:#79716B;max-width:460px;margin:0 auto;line-height:1.55;")}>The AI drafts original control text mapped to the source standard — respecting each framework&apos;s reproduction policy (verbatim for public-domain, mapped-only for copyrighted).</div>
        </div>
      )}

      {st === "analyzing" && (
        <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;padding:24px;")}>
          <div style={css("font-size:14px;font-weight:600;margin-bottom:18px;")}>Generating standard…</div>
          <div style={css("display:flex;flex-direction:column;gap:14px;")}>
            {AI_STAGES.map((label, i) => {
              const done = i < cur;
              const activeSpin = i === cur;
              return (
                <div key={label} style={css("display:flex;align-items:center;gap:12px;")}>
                  {activeSpin ? (
                    <span style={css("width:20px;height:20px;border:3px solid #cdd8ea;border-top-color:#0f4c9c;border-radius:50%;animation:hh-spin .8s linear infinite;flex-shrink:0;")} />
                  ) : (
                    <span style={css(`width:20px;height:20px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-family:'Fragment Mono',monospace;background:${done ? "#1f7a4d" : "#E7E6E5"};color:${done ? "#fff" : "#79716B"};`)}>{done ? "✓" : String(i + 1)}</span>
                  )}
                  <span style={css(`font-size:13.5px;color:${i <= cur ? "#1C1917" : "#79716B"};font-weight:${i === cur ? 600 : 400};`)}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {st === "done" && (
        <>
          <div style={css("background:#f0f7f3;border:1px solid #cfe0d6;border-radius:20px;padding:16px 18px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;")}>
            <div style={css("font-size:13.5px;color:#186340;")}>
              <b>✓ Draft ready.</b> AI generated <b>387 controls</b> from the source, mapped to NIST 800-53 · CSF · ISO 27002. Review before publishing.
            </div>
            <button onClick={() => resetAI()} style={css("background:transparent;border:1px solid #b6d2c1;color:#186340;border-radius:7px;padding:8px 14px;font-size:12.5px;font-weight:600;cursor:pointer;")}>New generation</button>
          </div>
          <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;overflow:hidden;")}>
            <div style={css("display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid #EFEEEC;background:#FBFAF9;")}>
              <div style={css("font-size:13.5px;")}><b>Review &amp; reconcile</b> — edit any AI-drafted field before approving</div>
              <button style={css("background:#1f7a4d;color:#fff;border:none;border-radius:7px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;")}>Approve &amp; create product</button>
            </div>
            <div style={css("display:grid;grid-template-columns:70px 1fr 130px 90px 90px;background:#F1F2EA;border-bottom:1px solid #E7E6E5;padding:9px 18px;font-size:11px;font-weight:600;color:#79716B;text-transform:uppercase;letter-spacing:.4px;")}>
              <div>ID</div><div>Title</div><div>Family</div><div>Severity</div><div>Status</div>
            </div>
            {ingestRows.map((c) => (
              <div key={c.id} style={css("display:grid;grid-template-columns:70px 1fr 130px 90px 90px;padding:11px 18px;border-bottom:1px solid #EFEEEC;font-size:12.5px;align-items:center;")}>
                <div style={css("font-family:'Fragment Mono',monospace;font-weight:600;color:#1C1917;")}>{c.id}</div>
                <div>{c.title}</div>
                <div style={css("color:#57534E;")}>{c.family}</div>
                <div><span style={css(sevStyle(c.severity))}>{c.severity}</span></div>
                <div><span style={css(c.review ? "font-size:11px;font-weight:600;color:#b5721c;background:#f6efe4;padding:2px 9px;border-radius:20px;" : "font-size:11px;font-weight:600;color:#6a2f6a;background:#f2e9f2;padding:2px 9px;border-radius:20px;")}>{c.conf}</span></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
