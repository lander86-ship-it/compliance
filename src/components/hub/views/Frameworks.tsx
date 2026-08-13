"use client";

import React from "react";
import { useHub } from "@/lib/hub/store";
import { css } from "@/lib/hub/theme";

type PublishedStandard = {
  id: string;
  title: string;
  platform: string | null;
  summary: string | null;
  sourceUrl: string | null;
  bundleId: string | null;
  bundleName: string | null;
  bundlePrice: string | null;
  priceCents: number | null;
  owned: boolean;
};

// Storefront catalog of published policy standards. Buyers purchase the assigned bundle,
// then generate their own copy (with their company name + house-style template) into My Library.
export function Frameworks() {
  const { s, go, addToCart } = useHub();
  const m = s.isMobile;
  const [items, setItems] = React.useState<PublishedStandard[] | null>(null);
  const [genFor, setGenFor] = React.useState<string | null>(null);
  const [legal, setLegal] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<{ id: string; text: string; ok: boolean } | null>(null);

  const load = React.useCallback(() => {
    fetch("/api/standards")
      .then((r) => (r.ok ? r.json() : { standards: [] }))
      .then((d) => setItems(d.standards || []))
      .catch(() => setItems([]));
  }, []);
  React.useEffect(() => { load(); }, [load, s.entitlements]);

  // Client-side ownership so the card reacts to purchases made this session.
  const ent = s.entitlements;
  const isOwned = (st: PublishedStandard) =>
    st.owned || s.entAdmin || !!(st.bundleId && ent && (ent.bundleIds.includes(st.bundleId) || ent.bundleIds.includes("pk-std-all")));

  const buy = (st: PublishedStandard) => {
    if (!st.bundleId) return;
    addToCart(st.bundleId);
    go("cart");
  };

  const generate = async (st: PublishedStandard) => {
    if (!legal.trim()) { setMsg({ id: st.id, text: "Enter your organization's legal name.", ok: false }); return; }
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/standards/${st.id}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ legal: legal.trim() }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setMsg({ id: st.id, text: d.error || "Generation failed.", ok: false }); setBusy(false); return; }
      setBusy(false);
      setGenFor(null);
      setLegal("");
      go("library");
    } catch {
      setMsg({ id: st.id, text: "Generation failed.", ok: false });
      setBusy(false);
    }
  };

  return (
    <div style={css(`max-width:1180px;${m ? "padding:20px 16px 48px;" : "padding:26px 34px 60px;"}`)}>
      <h1 style={css("margin:0 0 4px;font-size:26px;font-weight:700;letter-spacing:-.4px;")}>Frameworks</h1>
      <p style={css("margin:0 0 22px;color:#57534E;font-size:14px;")}>Editable policy standards mapped to compliance frameworks. Buy access, then generate your own branded copy.</p>

      {items === null ? (
        <div style={css("color:#79716B;font-size:14px;padding:40px 0;")}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={css("background:#FBFAF9;border:1px dashed #D6D3D1;border-radius:22px;padding:60px 30px;text-align:center;")}>
          <div style={css("font-size:16px;font-weight:600;margin-bottom:6px;color:#57534E;")}>No frameworks published yet</div>
          <p style={css("margin:0 auto 20px;max-width:460px;color:#79716B;font-size:13.5px;line-height:1.6;")}>Policy standards (NIST 800-53, ISO 27001, PCI DSS, SOC 2…) will appear here once published from the Admin catalog.</p>
          <button onClick={() => go("bundles")} style={css("background:#fff;color:#0f4c9c;border:1px solid #c3d2ea;border-radius:999px;padding:10px 20px;font-size:13.5px;font-weight:600;cursor:pointer;")}>Browse bundles instead</button>
        </div>
      ) : (
        <div style={css(`display:grid;grid-template-columns:${m ? "1fr" : "repeat(auto-fill,minmax(340px,1fr))"};gap:16px;`)}>
          {items.map((st) => {
            const owned = isOwned(st);
            return (
              <div key={st.id} style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:18px;padding:18px 20px;display:flex;flex-direction:column;")}>
                <div style={css("display:flex;gap:8px;align-items:center;margin-bottom:8px;")}>
                  {st.platform ? <span style={css("font-size:11px;font-weight:600;color:#0f4c9c;background:#eaf0fb;padding:2px 8px;border-radius:999px;")}>{st.platform}</span> : null}
                  {owned ? <span style={css("font-size:11px;font-weight:600;color:#1f7a4d;background:#e7f3ec;padding:2px 8px;border-radius:999px;")}>Owned</span> : null}
                </div>
                <div style={css("font-size:16px;font-weight:700;letter-spacing:-.2px;margin-bottom:6px;line-height:1.3;")}>{st.title}</div>
                <p style={css("margin:0 0 14px;color:#57534E;font-size:13px;line-height:1.55;flex:1;")}>{st.summary || "Editable policy standard."}</p>

                {owned ? (
                  genFor === st.id ? (
                    <div>
                      <label style={css("display:block;font-size:12px;font-weight:600;color:#57534E;margin-bottom:5px;")}>Organization legal name</label>
                      <input
                        value={legal}
                        onChange={(e) => setLegal(e.target.value)}
                        placeholder="Acme, S.L."
                        style={css("width:100%;box-sizing:border-box;border:1px solid #D6D3D1;border-radius:8px;padding:9px 11px;font-size:13px;margin-bottom:8px;")}
                      />
                      <p style={css("margin:0 0 10px;font-size:11.5px;color:#79716B;line-height:1.5;")}>{s.savedTemplate ? `Your saved template “${s.savedTemplate.name}” will be applied.` : "Upload a house-style template in My Library to brand the output."}</p>
                      <div style={css("display:flex;gap:8px;")}>
                        <button disabled={busy} onClick={() => generate(st)} className="hh-primary" style={css("flex:1;background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;opacity:" + (busy ? ".6" : "1") + ";")}>{busy ? "Generating…" : "Generate to Library"}</button>
                        <button disabled={busy} onClick={() => { setGenFor(null); setMsg(null); }} style={css("background:#fff;color:#57534E;border:1px solid #E7E6E5;border-radius:999px;padding:10px 14px;font-size:13px;font-weight:600;cursor:pointer;")}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setGenFor(st.id); setLegal(""); setMsg(null); }} className="hh-primary" style={css("width:100%;background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:11px;font-size:13.5px;font-weight:600;cursor:pointer;")}>Generate my copy</button>
                  )
                ) : (
                  <div>
                    <div style={css("font-size:13px;color:#57534E;margin-bottom:8px;")}>
                      {st.bundleName ? <>Included in <b>{st.bundleName}</b>{st.bundlePrice ? ` · ${st.bundlePrice}` : ""}</> : "Access sold separately."}
                    </div>
                    {st.bundleId ? (
                      <button onClick={() => buy(st)} className="hh-primary" style={css("width:100%;background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:11px;font-size:13.5px;font-weight:600;cursor:pointer;")}>{s.user ? "Buy access" : "Sign in to buy"}</button>
                    ) : (
                      <button onClick={() => go("bundles")} style={css("width:100%;background:#fff;color:#0f4c9c;border:1px solid #c3d2ea;border-radius:999px;padding:11px;font-size:13.5px;font-weight:600;cursor:pointer;")}>See bundles</button>
                    )}
                  </div>
                )}
                {msg && msg.id === st.id ? <div style={css("margin-top:8px;font-size:12px;color:" + (msg.ok ? "#1f7a4d" : "#b4381f") + ";")}>{msg.text}</div> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
