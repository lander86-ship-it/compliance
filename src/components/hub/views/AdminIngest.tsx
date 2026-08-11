"use client";

import React, { useEffect, useState } from "react";
import { useHub } from "@/lib/hub/store";
import { css, statusPill } from "@/lib/hub/theme";

type Std = { id: string; title: string; sourceUrl: string | null; platform: string | null; summary: string | null; status: string; hidden: boolean; bundleId: string | null; priceCents: number | null; createdAt: string };

const fmtDate = (s: string) => { try { return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); } catch { return s; } };

export function AdminIngest() {
  const { s, set } = useHub();
  const [list, setList] = useState<Std[] | null>(null);
  const [gen, setGen] = useState<"idle" | "busy">("idle");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = () => fetch("/api/admin/standards").then((r) => (r.ok ? r.json() : { standards: [] })).then((d) => setList(d.standards || [])).catch(() => setList([]));
  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGen("busy"); setMsg(null);
    try {
      const r = await fetch("/api/admin/standards", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: s.aiUrl }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Generation failed");
      setMsg({ ok: true, text: `Drafted "${d.title}"${d.aiUsed ? " with Claude" : " (fallback draft — set ANTHROPIC_API_KEY for AI)"}. Review and publish below.` });
      load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Generation failed" });
    } finally { setGen("idle"); }
  };
  const patch = async (id: string, body: Record<string, unknown>) => { await fetch(`/api/admin/standards/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); load(); };
  const del = async (id: string) => { if (!confirm("Delete this standard?")) return; await fetch(`/api/admin/standards/${id}`, { method: "DELETE" }); load(); };

  const card = "background:#FBFAF9;border:1px solid #E7E6E5;border-radius:20px;padding:22px;margin-bottom:18px;";
  const dl = "font-size:12px;font-family:'Fragment Mono',monospace;background:#F1F2EA;color:#0f4c9c;padding:6px 11px;border-radius:6px;font-weight:600;text-decoration:none;";

  return (
    <div style={css("padding:26px 34px 60px;max-width:1000px;")}>
      <div style={css("display:flex;align-items:center;gap:10px;margin-bottom:4px;")}>
        <h1 style={css("margin:0;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>AI Standard Generator</h1>
        <span style={css("font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#6a2f6a;background:#f2e9f2;border:1px solid #e2cfe2;padding:3px 8px;border-radius:20px;")}>AI</span>
      </div>
      <p style={css("margin:0 0 22px;color:#57534E;font-size:14px;")}>Paste a source link — Claude analyses it and drafts an original standard in English. Review, download to check it, then publish it into the catalog (hidden), where you assign a bundle and price.</p>

      <div style={css(card)}>
        <label style={css("font-size:12px;font-weight:600;color:#57534E;display:block;margin-bottom:7px;")}>Source URL</label>
        <div style={css("display:flex;gap:10px;flex-wrap:wrap;")}>
          <input value={s.aiUrl} onChange={(e) => set({ aiUrl: e.target.value })} placeholder="https://…" style={css("flex:1;min-width:240px;border:1px solid #E7E6E5;border-radius:8px;padding:11px 12px;font-size:13.5px;font-family:'Fragment Mono',monospace;color:#1C1917;outline:none;")} />
          <button onClick={generate} disabled={gen === "busy"} className="hh-primary" style={css(`background:${gen === "busy" ? "#7fa4d0" : "#0f4c9c"};color:#fff;border:none;border-radius:8px;padding:0 22px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;`)}>{gen === "busy" ? "Generating…" : "Generate standard"}</button>
        </div>
        {msg && <div style={css(`margin-top:12px;font-size:13px;color:${msg.ok ? "#186340" : "#8a3b3b"};`)}>{msg.text}</div>}
      </div>

      <h3 style={css("margin:0 0 12px;font-size:15px;font-weight:600;")}>Generated standards</h3>
      {list === null ? (
        <div style={css("color:#79716B;font-size:14px;padding:20px 0;")}>Loading…</div>
      ) : list.length === 0 ? (
        <div style={css("background:#FBFAF9;border:1px dashed #D6D3D1;border-radius:18px;padding:36px;text-align:center;color:#79716B;font-size:14px;")}>No standards yet. Generate one from a source URL above.</div>
      ) : (
        <div style={css("display:flex;flex-direction:column;gap:12px;")}>
          {list.map((st) => (
            <div key={st.id} style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:16px;padding:16px 18px;")}>
              <div style={css("display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px;")}>
                <span style={css("font-size:15px;font-weight:600;")}>{st.title}</span>
                <span style={css(statusPill(st.status === "published" ? "#1f7a4d" : "#b5721c"))}>{st.status}</span>
                {st.status === "published" && <span style={css(statusPill(st.hidden ? "#79716B" : "#0f4c9c"))}>{st.hidden ? "hidden" : "visible"}</span>}
              </div>
              <div style={css("font-size:12px;color:#79716B;font-family:'Fragment Mono',monospace;margin-bottom:10px;")}>{st.platform || "—"} · {fmtDate(st.createdAt)}{st.sourceUrl ? ` · ${st.sourceUrl.slice(0, 60)}` : ""}</div>
              <div style={css("display:flex;gap:8px;flex-wrap:wrap;align-items:center;")}>
                <a href={`/api/admin/standards/${st.id}/download?fmt=docx`} style={css(dl)}>↓ DOCX</a>
                <a href={`/api/admin/standards/${st.id}/download?fmt=pdf`} style={css(dl)}>↓ PDF</a>
                {st.status === "draft"
                  ? <button onClick={() => patch(st.id, { publish: true })} style={css("background:#1f7a4d;color:#fff;border:none;border-radius:7px;padding:7px 14px;font-size:12.5px;font-weight:600;cursor:pointer;")}>Publish to catalog</button>
                  : <span style={css("font-size:12px;color:#57534E;")}>Manage bundle &amp; price in <b style={css("cursor:pointer;color:#0f4c9c;")} onClick={() => set({ view: "admin-catalog" })}>Catalog &amp; pricing</b>.</span>}
                <button onClick={() => del(st.id)} style={css("background:#fff;color:#8a3b3b;border:1px solid #e3c9c9;border-radius:7px;padding:7px 12px;font-size:12.5px;font-weight:600;cursor:pointer;margin-left:auto;")}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
