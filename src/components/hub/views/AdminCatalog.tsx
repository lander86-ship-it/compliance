"use client";

import React, { useEffect, useState } from "react";
import { css } from "@/lib/hub/theme";
import { CATEGORY_KEYWORDS, type Bundle } from "@/lib/hub/data";

const CATEGORIES = Object.keys(CATEGORY_KEYWORDS);
const SOURCES: ("cis" | "disa")[] = ["cis", "disa"];

type Editing = Partial<Bundle> & { _new?: boolean };

function BundleEditor({ b, onClose, onSaved }: { b: Editing; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(b.name || "");
  const [price, setPrice] = useState(b.price || "");
  const [tagline, setTagline] = useState(b.tagline || "");
  const [family, setFamily] = useState(b.family || "hardening");
  const [featured, setFeatured] = useState(!!b.featured);
  const [sources, setSources] = useState<string[]>(b.sources || ["cis", "disa"]);
  const [categories, setCategories] = useState<string[]>(b.categories || []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const save = async () => {
    setBusy(true); setMsg(null);
    const body: Record<string, unknown> = { name, price, tagline, family, featured, sources, categories };
    if (!b._new) body.id = b.id;
    const r = await fetch("/api/admin/catalog", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) { setMsg(d.error || "Save failed"); return; }
    onSaved(); onClose();
  };

  const input = "width:100%;padding:10px 12px;border:1px solid #E7E6E5;border-radius:9px;font-size:13.5px;background:#fff;outline:none;box-sizing:border-box;";
  const label = "font-size:12px;font-weight:600;color:#57534E;margin-bottom:5px;display:block;";
  const chip = (on: boolean) => `font-size:12px;padding:5px 11px;border-radius:999px;cursor:pointer;border:1px solid ${on ? "#0f4c9c" : "#E7E6E5"};background:${on ? "#eef4fb" : "#fff"};color:${on ? "#0f4c9c" : "#57534E"};font-weight:${on ? 600 : 500};`;

  return (
    <div onClick={onClose} style={css("position:fixed;inset:0;background:rgba(28,25,23,.45);z-index:100;display:flex;align-items:flex-start;justify-content:center;padding:40px 16px;overflow-y:auto;")}>
      <div onClick={(e) => e.stopPropagation()} style={css("background:#fff;border-radius:20px;max-width:560px;width:100%;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.25);")}>
        <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;")}>
          <h3 style={css("margin:0;font-size:17px;font-weight:700;")}>{b._new ? "New bundle" : "Edit bundle"}</h3>
          <button onClick={onClose} style={css("background:none;border:none;font-size:20px;cursor:pointer;color:#79716B;")}>×</button>
        </div>
        <div style={css("display:grid;grid-template-columns:2fr 1fr;gap:12px;margin-bottom:12px;")}>
          <div><label style={css(label)}>Name</label><input value={name} onChange={(e) => setName(e.target.value)} style={css(input)} /></div>
          <div><label style={css(label)}>Price</label><input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$1,290" style={css(input)} /></div>
        </div>
        <div style={css("margin-bottom:12px;")}><label style={css(label)}>Tagline</label><input value={tagline} onChange={(e) => setTagline(e.target.value)} style={css(input)} /></div>
        <div style={css("display:flex;gap:18px;align-items:center;margin-bottom:14px;")}>
          <div><label style={css(label)}>Family</label>
            <select value={family} onChange={(e) => setFamily(e.target.value)} style={css(input + "width:auto;")}>
              <option value="hardening">hardening</option><option value="standards">standards</option>
            </select>
          </div>
          <label style={css("display:flex;align-items:center;gap:8px;font-size:13px;margin-top:20px;cursor:pointer;")}><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Featured</label>
        </div>
        <div style={css("margin-bottom:14px;")}>
          <label style={css(label)}>Sources unlocked</label>
          <div style={css("display:flex;gap:8px;")}>{SOURCES.map((sc) => <span key={sc} onClick={() => toggle(sources, setSources, sc)} style={css(chip(sources.includes(sc)))}>{sc.toUpperCase()}</span>)}</div>
        </div>
        <div style={css("margin-bottom:16px;")}>
          <label style={css(label)}>Categories entitled</label>
          <div style={css("display:flex;gap:7px;flex-wrap:wrap;")}>{CATEGORIES.map((c) => <span key={c} onClick={() => toggle(categories, setCategories, c)} style={css(chip(categories.includes(c)))}>{c}</span>)}</div>
        </div>
        {msg && <div style={css("font-size:13px;color:#8a3b3b;margin-bottom:12px;")}>{msg}</div>}
        <button onClick={save} disabled={busy} className="hh-primary" style={css(`background:${busy ? "#7fa4d0" : "#0f4c9c"};color:#fff;border:none;border-radius:999px;padding:11px 24px;font-size:13.5px;font-weight:600;cursor:pointer;`)}>{busy ? "Saving…" : "Save bundle"}</button>
      </div>
    </div>
  );
}

export function AdminCatalog() {
  const [bundles, setBundles] = useState<Bundle[] | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);

  const load = () => fetch("/api/admin/catalog").then((r) => (r.ok ? r.json() : { bundles: [] })).then((d) => setBundles(d.bundles || [])).catch(() => setBundles([]));
  useEffect(() => { load(); }, []);
  const del = async (id: string) => { if (!confirm("Remove this bundle from the catalog?")) return; await fetch(`/api/admin/catalog?id=${encodeURIComponent(id)}`, { method: "DELETE" }); load(); };

  return (
    <div style={css("padding:26px 34px 60px;max-width:1080px;")}>
      <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;")}>
        <h1 style={css("margin:0;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>Catalog &amp; pricing</h1>
        <button onClick={() => setEditing({ _new: true })} style={css("background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:10px 18px;font-size:13px;font-weight:600;cursor:pointer;")}>+ New bundle</button>
      </div>
      {bundles === null ? (
        <div style={css("color:#79716B;font-size:14px;padding:30px 0;")}>Loading catalog…</div>
      ) : (
        <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;overflow:hidden;")}>
          <div style={css("display:grid;grid-template-columns:2fr 90px 1.4fr 120px;background:#F1F2EA;border-bottom:1px solid #E7E6E5;padding:11px 18px;font-size:11px;font-weight:600;color:#79716B;text-transform:uppercase;letter-spacing:.4px;")}>
            <div>Bundle</div><div>Price</div><div>Access</div><div></div>
          </div>
          {bundles.map((b) => (
            <div key={b.id} style={css("display:grid;grid-template-columns:2fr 90px 1.4fr 120px;padding:14px 18px;border-bottom:1px solid #EFEEEC;font-size:13px;align-items:center;")}>
              <div><div style={css("font-weight:600;")}>{b.name}{b.featured ? " ★" : ""}</div><div style={css("font-size:11.5px;color:#79716B;")}>{b.tagline}</div></div>
              <div style={css("font-family:'Fragment Mono',monospace;font-weight:600;")}>{b.price}</div>
              <div style={css("font-size:11.5px;color:#57534E;")}>{(b.sources || []).map((x) => x.toUpperCase()).join("+") || "—"}{b.categories && b.categories.length ? ` · ${b.categories.length} cat` : ""}</div>
              <div style={css("display:flex;gap:8px;justify-content:flex-end;")}>
                <button onClick={() => setEditing(b)} style={css("background:#0f4c9c;color:#fff;border:none;border-radius:7px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;")}>Edit</button>
                <button onClick={() => del(b.id)} style={css("background:#fff;color:#8a3b3b;border:1px solid #e3c9c9;border-radius:7px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer;")}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && <BundleEditor b={editing} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  );
}
