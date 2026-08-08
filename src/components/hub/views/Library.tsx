"use client";

import React, { useEffect } from "react";
import { useHub } from "@/lib/hub/store";
import { css, statusPill } from "@/lib/hub/theme";

const SOURCE_LABEL: Record<string, string> = { cis: "CIS", disa: "DISA", baked: "Demo" };

export function Library() {
  const { s, go, loadGenerations } = useHub();
  const artChip = "font-size:11px;font-family:'Fragment Mono',monospace;background:#F1F2EA;color:#0f4c9c;padding:3px 9px;border-radius:5px;font-weight:600;";

  useEffect(() => {
    if (s.generationsStatus === "idle") loadGenerations();
  }, [s.generationsStatus, loadGenerations]);

  const fresh = s.genStatus === "done" && s.genArtifacts.length > 0 ? s.genArtifacts : null;
  const history = s.generations || [];
  const loading = s.generationsStatus === "loading" || s.generationsStatus === "idle";

  return (
    <div style={css("padding:26px 34px 60px;max-width:1080px;")}>
      <div style={css("display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:22px;flex-wrap:wrap;gap:12px;")}>
        <div>
          <h1 style={css("margin:0;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>Library</h1>
          <p style={css("margin:6px 0 0;color:#57534E;font-size:14px;")}>The hardening guides you have generated.</p>
        </div>
        <button onClick={() => go("generator")} className="hh-primary" style={css("background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:11px 20px;font-size:13.5px;font-weight:600;cursor:pointer;")}>Generate a guide</button>
      </div>

      {/* Just generated this session — real, downloadable artifacts. */}
      {fresh && (
        <div style={css("background:#f0f7f3;border:1px solid #cfe0d6;border-radius:20px;padding:20px;margin-bottom:18px;")}>
          <div style={css("display:flex;align-items:center;gap:10px;margin-bottom:10px;")}>
            <span style={css("font-size:15px;font-weight:600;")}>{s.selectedGuide?.name || s.wizName || "Latest guide"}</span>
            <span style={css(statusPill("#1f7a4d"))}>Ready</span>
          </div>
          <div style={css("display:flex;gap:8px;flex-wrap:wrap;")}>
            {fresh.map((a) => (
              <a key={a.format} href={a.url} style={css(artChip + "text-decoration:none;")}>↓ {a.format}</a>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div style={css("color:#79716B;font-size:14px;padding:40px 0;")}>Loading your library…</div>
      ) : history.length === 0 && !fresh ? (
        <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:20px;padding:44px;text-align:center;")}>
          <div style={css("font-size:15px;font-weight:600;margin-bottom:6px;")}>No guides generated yet</div>
          <p style={css("margin:0 0 18px;color:#79716B;font-size:13.5px;")}>Pick a benchmark and generate your first hardening guide.</p>
          <button onClick={() => go("generator")} className="hh-primary" style={css("background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:11px 22px;font-size:13.5px;font-weight:600;cursor:pointer;")}>Generate a guide</button>
        </div>
      ) : (
        <div style={css("display:flex;flex-direction:column;gap:12px;")}>
          {history.map((g) => (
            <div key={g.id} style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:18px;padding:18px 20px;display:flex;align-items:center;gap:16px;")}>
              <div style={css("width:44px;height:44px;border-radius:9px;background:#F1F2EA;display:flex;align-items:center;justify-content:center;font-family:'Fragment Mono',monospace;font-weight:600;color:#0f4c9c;font-size:11px;flex-shrink:0;")}>{SOURCE_LABEL[g.source] || g.source.toUpperCase()}</div>
              <div style={css("flex:1;min-width:0;")}>
                <div style={css("font-size:14.5px;font-weight:600;")}>{g.guideName || g.guideRef || "Hardening guide"}</div>
                <div style={css("font-size:12px;color:#79716B;font-family:'Fragment Mono',monospace;margin-top:3px;")}>{new Date(g.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                {g.formats.length > 0 && (
                  <div style={css("display:flex;gap:6px;margin-top:9px;flex-wrap:wrap;")}>
                    {g.formats.map((f) => (<span key={f} style={css(artChip)}>{f}</span>))}
                  </div>
                )}
              </div>
              <button onClick={() => go("generator")} style={css("background:#fff;color:#0f4c9c;border:1px solid #c3d2ea;border-radius:999px;padding:8px 16px;font-size:12.5px;font-weight:600;cursor:pointer;flex-shrink:0;")}>Regenerate</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
