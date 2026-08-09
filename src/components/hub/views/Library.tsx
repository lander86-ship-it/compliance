"use client";

import React, { useEffect, useRef, useState } from "react";
import { useHub } from "@/lib/hub/store";
import { css, statusPill } from "@/lib/hub/theme";

const SOURCE_LABEL: Record<string, string> = { cis: "CIS", disa: "DISA", baked: "Demo" };

function TemplateCard() {
  const { s, loadSavedTemplate, saveTemplate, removeSavedTemplate } = useHub();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (s.savedTemplateStatus === "idle") loadSavedTemplate();
  }, [s.savedTemplateStatus, loadSavedTemplate]);

  const onFile = async (file: File) => {
    setErr("");
    const type = file.name.toLowerCase().endsWith(".pdf") ? "pdf" : file.name.toLowerCase().endsWith(".docx") ? "docx" : "";
    if (!type) { setErr("Upload a .docx or .pdf template."); return; }
    if (file.size > 15_000_000) { setErr("Template too large (max 15 MB)."); return; }
    setBusy(true);
    const b64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1] || "");
      r.onerror = () => reject(new Error("read failed"));
      r.readAsDataURL(file);
    });
    const res = await saveTemplate({ base64: b64, type: type as "docx" | "pdf", name: file.name });
    setBusy(false);
    if (!res.ok) setErr(res.error || "Save failed");
  };

  const t = s.savedTemplate;
  return (
    <div style={css("background:#eef4fb;border:1px solid #cfe0f2;border-radius:18px;padding:18px 20px;margin-bottom:18px;")}>
      <div style={css("display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;")}>
        <div style={css("min-width:0;")}>
          <div style={css("font-size:14.5px;font-weight:700;color:#0f4c9c;")}>Default house-style template</div>
          <div style={css("font-size:12.5px;color:#57534E;margin-top:3px;")}>
            {t ? <>Using <b>{t.name}</b> ({t.type.toUpperCase()}) for every generation — no need to re-upload.</> : "Upload your DOCX/PDF template once; it's applied to all guides you generate."}
          </div>
          {err && <div style={css("font-size:12px;color:#8a3b3b;margin-top:6px;")}>{err}</div>}
        </div>
        <div style={css("display:flex;gap:8px;flex-shrink:0;")}>
          <input ref={fileRef} type="file" accept=".docx,.pdf" style={css("display:none;")} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
          <button onClick={() => fileRef.current?.click()} disabled={busy} className="hh-primary" style={css(`background:${busy ? "#7fa4d0" : "#0f4c9c"};color:#fff;border:none;border-radius:999px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;`)}>{busy ? "Uploading…" : t ? "Replace" : "Upload template"}</button>
          {t && <button onClick={() => removeSavedTemplate()} style={css("background:#fff;color:#8a3b3b;border:1px solid #e3c9c9;border-radius:999px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;")}>Remove</button>}
        </div>
      </div>
    </div>
  );
}

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
          <p style={css("margin:6px 0 0;color:#57534E;font-size:14px;")}>Every hardening guide you have generated — download again anytime.</p>
        </div>
        <button onClick={() => go("generator")} className="hh-primary" style={css("background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:11px 20px;font-size:13.5px;font-weight:600;cursor:pointer;")}>Generate a guide</button>
      </div>

      <TemplateCard />

      {fresh && (
        <div style={css("background:#f0f7f3;border:1px solid #cfe0d6;border-radius:20px;padding:20px;margin-bottom:18px;")}>
          <div style={css("display:flex;align-items:center;gap:10px;margin-bottom:10px;")}>
            <span style={css("font-size:15px;font-weight:600;")}>{s.selectedGuide?.name || s.wizName || "Latest guide"}</span>
            <span style={css(statusPill("#1f7a4d"))}>Ready</span>
          </div>
          <div style={css("display:flex;gap:8px;flex-wrap:wrap;")}>
            {fresh.map((a) => (<a key={a.format} href={a.url} style={css(artChip + "text-decoration:none;")}>↓ {a.format}</a>))}
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
                <div style={css("display:flex;gap:6px;margin-top:9px;flex-wrap:wrap;")}>
                  {(g.downloads && g.downloads.length ? g.downloads : g.formats.map((f) => ({ format: f, url: null }))).map((d) =>
                    d.url ? (
                      <a key={d.format} href={d.url} style={css(artChip + "text-decoration:none;")}>↓ {d.format}</a>
                    ) : (
                      <span key={d.format} style={css(artChip + "opacity:.5;")}>{d.format}</span>
                    ),
                  )}
                </div>
              </div>
              <button onClick={() => go("generator")} style={css("background:#fff;color:#0f4c9c;border:1px solid #c3d2ea;border-radius:999px;padding:8px 16px;font-size:12.5px;font-weight:600;cursor:pointer;flex-shrink:0;")}>Regenerate</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
