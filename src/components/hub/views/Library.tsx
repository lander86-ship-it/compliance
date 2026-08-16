"use client";

import React, { useEffect, useRef, useState } from "react";
import { useHub } from "@/lib/hub/store";
import { css, statusPill } from "@/lib/hub/theme";

const SOURCE_LABEL: Record<string, string> = { cis: "CIS", disa: "DISA", baked: "Demo" };

type Doc = { id: string; source: string | null; guideName: string; legal: string | null; version: number; createdAt: string; reviewedAt: string | null; nextReviewAt: string | null; hasDocx: boolean; hasPdf: boolean };

const fmtDate = (s: string | null) => { if (!s) return "—"; try { return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); } catch { return s; } };

function TemplateCard() {
  const { s, loadSavedTemplate, saveTemplate, removeSavedTemplate } = useHub();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { if (s.savedTemplateStatus === "idle") loadSavedTemplate(); }, [s.savedTemplateStatus, loadSavedTemplate]);
  const onFile = async (file: File) => {
    setErr("");
    const type = file.name.toLowerCase().endsWith(".pdf") ? "pdf" : file.name.toLowerCase().endsWith(".docx") ? "docx" : "";
    if (!type) { setErr("Upload a .docx or .pdf template."); return; }
    if (file.size > 15_000_000) { setErr("Template too large (max 15 MB)."); return; }
    setBusy(true);
    const b64 = await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result).split(",")[1] || ""); r.onerror = () => reject(new Error("read failed")); r.readAsDataURL(file); });
    const res = await saveTemplate({ base64: b64, type: type as "docx" | "pdf", name: file.name });
    setBusy(false); if (!res.ok) setErr(res.error || "Save failed");
  };
  const t = s.savedTemplate;
  return (
    <div style={css("background:#eef4fb;border:1px solid #cfe0f2;border-radius:18px;padding:18px 20px;margin-bottom:18px;")}>
      <div style={css("display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;")}>
        <div style={css("min-width:0;")}>
          <div style={css("font-size:14.5px;font-weight:700;color:#0f4c9c;")}>Default house-style template</div>
          <div style={css("font-size:12.5px;color:#57534E;margin-top:3px;")}>{t ? <>Using <b>{t.name}</b> ({t.type.toUpperCase()}) for every generation.</> : "Upload your DOCX/PDF template once; it's applied to all guides."}</div>
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
  const { s, go } = useHub();
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const artChip = "font-size:11px;font-family:'Fragment Mono',monospace;background:#F1F2EA;color:#0f4c9c;padding:5px 11px;border-radius:5px;font-weight:600;text-decoration:none;";

  const load = () => fetch("/api/library").then((r) => (r.ok ? r.json() : { docs: [] })).then((d) => setDocs(d.docs || [])).catch(() => setDocs([]));
  useEffect(() => { load(); }, []);
  const markReviewed = async (id: string) => { await fetch(`/api/library/${id}/review`, { method: "POST" }); load(); };

  const reviewState = (d: Doc): { label: string; color: string } => {
    if (!d.nextReviewAt) return { label: "", color: "#79716B" };
    const days = Math.round((new Date(d.nextReviewAt).getTime() - Date.now()) / (24 * 3600 * 1000));
    if (days < 0) return { label: `Review overdue by ${-days}d`, color: "#8a3b3b" };
    if (days < 30) return { label: `Review due in ${days}d`, color: "#b5721c" };
    return { label: `Next review ${fmtDate(d.nextReviewAt)}`, color: "#186340" };
  };

  return (
    <div style={css("padding:26px 34px 60px;max-width:1080px;")}>
      <div style={css("display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:22px;flex-wrap:wrap;gap:12px;")}>
        <div>
          <h1 style={css("margin:0;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>Library</h1>
          <p style={css("margin:6px 0 0;color:#57534E;font-size:14px;")}>Everything you generate — hardening guides and the policy standards you own — download, track versions, and re-sign as reviewed.</p>
        </div>
        <button onClick={() => go("generator")} className="hh-primary" style={css("background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:11px 20px;font-size:13.5px;font-weight:600;cursor:pointer;")}>＋ Generate a document</button>
      </div>

      <TemplateCard />

      {docs === null ? (
        <div style={css("color:#79716B;font-size:14px;padding:40px 0;")}>Loading your library…</div>
      ) : docs.length === 0 ? (
        <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:20px;padding:44px;text-align:center;")}>
          <div style={css("font-size:15px;font-weight:600;margin-bottom:6px;")}>Nothing generated yet</div>
          <p style={css("margin:0 0 18px;color:#79716B;font-size:13.5px;")}>Generate a hardening guide (CIS/DISA) or a policy standard you own.</p>
          <button onClick={() => go("generator")} className="hh-primary" style={css("background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:11px 22px;font-size:13.5px;font-weight:600;cursor:pointer;")}>＋ Generate a document</button>
        </div>
      ) : (
        <div style={css("display:flex;flex-direction:column;gap:12px;")}>
          {docs.map((d) => {
            const rev = reviewState(d);
            return (
              <div key={d.id} style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:18px;padding:18px 20px;")}>
                <div style={css("display:flex;align-items:center;gap:14px;")}>
                  <div style={css("width:44px;height:44px;border-radius:9px;background:#F1F2EA;display:flex;align-items:center;justify-content:center;font-family:'Fragment Mono',monospace;font-weight:600;color:#0f4c9c;font-size:11px;flex-shrink:0;")}>{SOURCE_LABEL[d.source || ""] || (d.source || "?").toUpperCase()}</div>
                  <div style={css("flex:1;min-width:0;")}>
                    <div style={css("display:flex;align-items:center;gap:9px;flex-wrap:wrap;")}>
                      <span style={css("font-size:14.5px;font-weight:600;")}>{d.guideName}</span>
                      <span style={css(statusPill("#0f4c9c"))}>v{d.version}</span>
                    </div>
                    <div style={css("font-size:12px;color:#79716B;font-family:'Fragment Mono',monospace;margin-top:3px;")}>{d.legal ? `${d.legal} · ` : ""}created {fmtDate(d.createdAt)}{d.reviewedAt ? ` · reviewed ${fmtDate(d.reviewedAt)}` : ""}</div>
                  </div>
                  <div style={css("text-align:right;flex-shrink:0;")}>
                    {rev.label && <div style={css(`font-size:12px;font-weight:600;color:${rev.color};`)}>{rev.label}</div>}
                  </div>
                </div>
                <div style={css("display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:center;")}>
                  {d.hasDocx && <a href={`/api/library/${d.id}/download?fmt=docx`} style={css(artChip)}>↓ DOCX</a>}
                  {d.hasPdf && <a href={`/api/library/${d.id}/download?fmt=pdf`} style={css(artChip)}>↓ PDF</a>}
                  <button onClick={() => markReviewed(d.id)} style={css("background:#fff;color:#186340;border:1px solid #b6d2c1;border-radius:999px;padding:7px 15px;font-size:12.5px;font-weight:600;cursor:pointer;")}>✓ Sign as reviewed</button>
                  <button onClick={() => go("generator")} style={css("background:#fff;color:#0f4c9c;border:1px solid #c3d2ea;border-radius:999px;padding:7px 15px;font-size:12.5px;font-weight:600;cursor:pointer;margin-left:auto;")}>Regenerate</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
