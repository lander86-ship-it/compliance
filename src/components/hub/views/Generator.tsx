"use client";

import React from "react";
import { useHub } from "@/lib/hub/store";
import { css } from "@/lib/hub/theme";
import { SOURCES, classifyGuide, type SourceId } from "@/lib/hub/data";
import { TemplateUpload, PolicyPreview } from "./Wizard";

const COLORS = ["#0f4c9c", "#6a2f6a", "#1f6a4d", "#b4381f", "#1C1917"];

// Client-side mirror of the server entitlement check, for pre-filtering the UI.
function useAllowed() {
  const { s } = useHub();
  const ent = s.entitlements;
  const admin = s.entAdmin || ent?.all;
  const sourceAllowed = (id: SourceId) => !!admin || !!ent?.sources.includes(id);
  const guideAllowed = (source: SourceId, name: string) => {
    if (admin) return true;
    if (!ent?.sources.includes(source)) return false;
    const cat = classifyGuide(name);
    return cat === "Other" || !!ent?.categories.includes(cat);
  };
  return { ent, admin, sourceAllowed, guideAllowed };
}

function SourcePicker() {
  const { s, setSource } = useHub();
  const { sourceAllowed } = useAllowed();
  return (
    <div style={css(`display:grid;grid-template-columns:${s.isMobile ? "1fr" : "1fr 1fr"};gap:14px;margin-bottom:22px;`)}>
      {SOURCES.map((src) => {
        const on = s.source === src.id;
        const allowed = sourceAllowed(src.id);
        return (
          <button key={src.id} disabled={!allowed} onClick={() => allowed && setSource(src.id)} style={css(`text-align:left;border:2px solid ${on ? src.color : "#E7E6E5"};background:${on ? src.color + "0c" : "#fff"};border-radius:14px;padding:16px;cursor:${allowed ? "pointer" : "not-allowed"};opacity:${allowed ? 1 : 0.55};position:relative;`)}>
            <div style={css("display:flex;align-items:center;gap:10px;margin-bottom:6px;")}>
              <span style={css(`width:12px;height:12px;border-radius:50%;background:${src.color};`)} />
              <span style={css("font-size:15px;font-weight:700;")}>{src.name}</span>
              {!allowed && <span style={css("font-size:10px;font-family:'Fragment Mono',monospace;background:#F1F2EA;color:#79716B;padding:2px 7px;border-radius:6px;margin-left:auto;")}>🔒 not in plan</span>}
            </div>
            <div style={css("font-size:12px;color:#57534E;line-height:1.5;")}>{src.connection}</div>
            <div style={css(`font-size:11px;color:${src.id === "disa" ? "#186340" : "#8a5a00"};margin-top:8px;font-weight:600;`)}>{src.license}</div>
          </button>
        );
      })}
    </div>
  );
}

function GuideBrowse() {
  const { s, searchGuides, selectGuide } = useHub();
  const { guideAllowed } = useAllowed();
  const [q, setQ] = React.useState("");

  // Load the source's catalog directly (no manual search) whenever the source
  // changes; the list is then filtered to what the subscription allows.
  React.useEffect(() => {
    if (s.guideStatus === "idle") searchGuides("");
  }, [s.source, s.guideStatus, searchGuides]);

  const allowed = s.guideResults.filter((g) => guideAllowed(g.source, g.name));
  const ql = q.trim().toLowerCase();
  const results = ql ? allowed.filter((g) => g.name.toLowerCase().includes(ql)) : allowed;

  return (
    <>
      <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;")}>
        <div style={css("font-size:13px;font-weight:700;")}>Guides you can generate{allowed.length ? ` (${allowed.length})` : ""}</div>
        {allowed.length > 6 && (
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…" style={css("border:1px solid #E7E6E5;border-radius:8px;padding:8px 12px;font-size:13px;outline:none;width:180px;")} />
        )}
      </div>

      {!s.guideAvailable && (
        <div style={css("border:1px solid #e6c9b8;background:#fbf3ec;border-radius:12px;padding:14px 16px;font-size:13px;color:#8a5a00;margin-bottom:14px;")}>
          {s.guideDetail || "This source is not connected yet."}
        </div>
      )}
      {s.guideStatus === "loading" && (
        <div style={css("display:flex;align-items:center;gap:12px;font-size:13px;color:#57534E;padding:12px 0;")}>
          <div style={css("width:18px;height:18px;border:3px solid #dfe6ef;border-top-color:#0f4c9c;border-radius:50%;animation:hh-spin .8s linear infinite;")} />
          Loading the {s.source === "cis" ? "CIS" : "DISA"} catalog you can generate…
        </div>
      )}
      {s.guideStatus === "failed" && (
        <div style={css("font-size:13px;color:#b4381f;padding:8px 0;")}>Could not load the catalog — {s.guideError}</div>
      )}
      {s.guideStatus === "done" && results.length === 0 && s.guideAvailable && (
        <div style={css("font-size:13px;color:#79716B;padding:8px 0;")}>{s.guideResults.length > 0 ? "No guides in your purchased categories for this source. Buy the matching bundle to unlock more." : "No benchmarks available for this source."}</div>
      )}
      {results.length > 0 && (
        <div style={css("border:1px solid #E7E6E5;border-radius:14px;overflow:hidden;max-height:420px;overflow-y:auto;")}>
          {results.map((g) => {
            const sel = s.selectedGuide?.ref === g.ref;
            return (
              <div key={g.ref} onClick={() => selectGuide(g)} style={css(`display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #EFEEEC;cursor:pointer;background:${sel ? "#eef4fb" : "#fff"};`)}>
                <div style={css("flex:1;min-width:0;")}>
                  <div style={css("font-size:13.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;")}>{g.name}</div>
                  <div style={css("font-size:11.5px;color:#79716B;font-family:'Fragment Mono',monospace;margin-top:2px;")}>{g.label}{g.controls ? ` · ~${g.controls} controls` : ""}</div>
                </div>
                <span style={css(`font-size:11px;font-weight:600;color:${sel ? "#0f4c9c" : "#79716B"};flex-shrink:0;`)}>{sel ? "✓ Selected" : "Select"}</span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function OrgFields() {
  const { s, setScope } = useHub();
  const f: [keyof typeof s.scope, string][] = [["legal", "Legal name"], ["owner", "Document owner"], ["docv", "Version"], ["classification", "Classification"]];
  return (
    <div style={css("margin-top:8px;")}>
      <div style={css("font-size:13px;font-weight:700;margin-bottom:10px;")}>Your organisation</div>
      <div style={css(`display:grid;grid-template-columns:${s.isMobile ? "1fr" : "1fr 1fr"};gap:12px;`)}>
        {f.map(([k, label]) => (
          <div key={k}>
            <label style={css("font-size:12px;font-weight:600;color:#57534E;display:block;margin-bottom:6px;")}>{label}</label>
            <input value={s.scope[k]} onChange={(e) => setScope(k, e.target.value)} style={css("width:100%;border:1px solid #E7E6E5;border-radius:8px;padding:10px 12px;font-size:14px;outline:none;")} />
          </div>
        ))}
      </div>
      <div style={css("display:flex;align-items:center;gap:10px;margin-top:14px;")}>
        <span style={css("font-size:12px;font-weight:600;color:#57534E;")}>Brand colour</span>
        {COLORS.map((c) => (
          <button key={c} onClick={() => setScope("color", c)} style={css(`width:26px;height:26px;border-radius:7px;background:${c};cursor:pointer;border:2px solid ${s.scope.color === c ? "#1C1917" : "transparent"};`)} />
        ))}
      </div>
    </div>
  );
}

// The published policy standards the buyer owns — generate their own copy into the Library.
function OwnedStandards() {
  const { s, go } = useHub();
  type Std = { id: string; title: string; platform: string | null; summary: string | null; owned: boolean };
  const [items, setItems] = React.useState<Std[] | null>(null);
  const [genFor, setGenFor] = React.useState<string | null>(null);
  const [legal, setLegal] = React.useState(s.scope.legal || "");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/standards").then((r) => (r.ok ? r.json() : { standards: [] }))
      .then((d) => setItems((d.standards || []).filter((x: Std) => x.owned)))
      .catch(() => setItems([]));
  }, [s.entitlements]);

  const generate = async (id: string) => {
    if (!legal.trim()) { setMsg("Enter your organization's legal name."); return; }
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`/api/standards/${id}/generate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ legal: legal.trim() }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setMsg(d.error || "Generation failed."); setBusy(false); return; }
      setBusy(false); setGenFor(null); go("library");
    } catch { setMsg("Generation failed."); setBusy(false); }
  };

  if (items === null) return <div style={css("color:#79716B;font-size:13px;padding:8px 0;")}>Loading your standards…</div>;
  if (items.length === 0) {
    return (
      <div style={css("border:1px solid #E7E6E5;background:#FBFAF9;border-radius:12px;padding:16px;font-size:13px;color:#57534E;line-height:1.5;")}>
        You don’t own any policy standards yet. <span onClick={() => go("frameworks")} style={css("color:#0f4c9c;font-weight:600;cursor:pointer;")}>Browse Frameworks</span> to buy NIST, ISO, PCI and other standards.
      </div>
    );
  }
  return (
    <div style={css("display:flex;flex-direction:column;gap:10px;")}>
      {items.map((st) => (
        <div key={st.id} style={css("border:1px solid #E7E6E5;background:#fff;border-radius:12px;padding:14px 16px;")}>
          <div style={css("display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;")}>
            {st.platform ? <span style={css("font-size:11px;font-weight:600;color:#6a2f6a;background:#f2e9f2;padding:2px 8px;border-radius:999px;")}>{st.platform}</span> : null}
            <span style={css("font-size:14px;font-weight:700;")}>{st.title}</span>
          </div>
          {st.summary ? <div style={css("font-size:12.5px;color:#57534E;line-height:1.5;margin-bottom:10px;")}>{st.summary}</div> : null}
          {genFor === st.id ? (
            <div>
              <label style={css("display:block;font-size:12px;font-weight:600;color:#57534E;margin-bottom:5px;")}>Organization legal name</label>
              <input value={legal} onChange={(e) => setLegal(e.target.value)} placeholder="Acme, S.L." style={css("width:100%;box-sizing:border-box;border:1px solid #D6D3D1;border-radius:8px;padding:9px 11px;font-size:13px;margin-bottom:8px;")} />
              <p style={css("margin:0 0 10px;font-size:11.5px;color:#79716B;")}>{s.savedTemplate ? `Your saved template “${s.savedTemplate.name}” will be applied.` : "No template uploaded — the SecureHub house style is used. Upload one in My Library to brand it."}</p>
              <div style={css("display:flex;gap:8px;")}>
                <button disabled={busy} onClick={() => generate(st.id)} className="hh-primary" style={css("flex:1;background:#1f7a4d;color:#fff;border:none;border-radius:999px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;opacity:" + (busy ? ".6" : "1") + ";")}>{busy ? "Generating…" : "Generate to Library"}</button>
                <button disabled={busy} onClick={() => { setGenFor(null); setMsg(null); }} style={css("background:#fff;color:#57534E;border:1px solid #E7E6E5;border-radius:999px;padding:10px 14px;font-size:13px;font-weight:600;cursor:pointer;")}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => { setGenFor(st.id); setMsg(null); }} className="hh-primary" style={css("background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;")}>Generate my copy</button>
          )}
          {msg && genFor === st.id ? <div style={css("margin-top:8px;font-size:12px;color:#b4381f;")}>{msg}</div> : null}
        </div>
      ))}
    </div>
  );
}

export function Generator() {
  const { s, previewStandard, generate, go } = useHub();
  const { admin, ent } = useAllowed();
  const g = s.selectedGuide;
  const hasHardening = admin || (ent && (ent.all || ent.sources.length > 0));

  const sectionTitle = "font-size:16px;font-weight:800;margin:0 0 2px;letter-spacing:-.2px;";
  const sectionCard = "border:1px solid #E7E6E5;border-radius:18px;padding:20px;margin-bottom:22px;background:#fff;";

  return (
    <div style={css(`max-width:900px;margin:0 auto;${s.isMobile ? "padding:20px 16px;" : "padding:30px 40px;"}`)}>
      <h2 style={css("margin:0 0 4px;font-size:24px;font-weight:800;")}>Generate a document</h2>
      <p style={css("margin:0 0 24px;color:#57534E;font-size:14px;")}>Create anything your subscription covers — hardening guides from CIS/DISA, and the policy standards you own — customised in your template and saved to your Library.</p>

      {/* ── Hardening guides (CIS & DISA) ── */}
      <div style={css(sectionCard)}>
        <h3 style={css(sectionTitle)}>Hardening guides · CIS &amp; DISA</h3>
        <p style={css("margin:0 0 16px;color:#79716B;font-size:12.5px;")}>Live from the current CIS Benchmark and DISA STIG releases.</p>
        {!hasHardening ? (
          <div style={css("border:1px solid #e6c9b8;background:#fbf3ec;border-radius:12px;padding:16px;")}>
            <div style={css("font-size:13.5px;font-weight:700;color:#8a5a00;margin-bottom:4px;")}>Not in your plan</div>
            <div style={css("font-size:12.5px;color:#57534E;margin-bottom:12px;line-height:1.5;")}>Buy the Hardening Access bundle to generate CIS and DISA guides.</div>
            <button onClick={() => go("bundles")} style={css("background:#fff;color:#0f4c9c;border:1px solid #c3d2ea;border-radius:999px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;")}>See bundles →</button>
          </div>
        ) : (
          <>
            {ent && !ent.all && !admin && (
              <div style={css("font-size:12px;color:#57534E;margin-bottom:14px;")}>Your plan: <strong>{ent.sources.map((x) => x.toUpperCase()).join(" + ")}</strong>{ent.categories.length ? ` · ${ent.categories.join(", ")}` : ""}.</div>
            )}
            <SourcePicker />
            <GuideBrowse />
            {g && (
        <div style={css("margin-top:26px;border-top:1px solid #E7E6E5;padding-top:24px;")}>
          <div style={css("border:1px solid #cfe0d6;background:#f0f7f3;border-radius:12px;padding:14px 16px;margin-bottom:20px;")}>
            <div style={css("font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#186340;font-weight:700;margin-bottom:3px;")}>Selected benchmark</div>
            <div style={css("font-size:15px;font-weight:700;")}>{g.name}</div>
            <div style={css("font-size:12px;color:#57534E;font-family:'Fragment Mono',monospace;")}>{g.source.toUpperCase()} · {g.label}{g.controls ? ` · ~${g.controls} controls` : ""}</div>
          </div>

          <OrgFields />
          <TemplateUpload />

          <div style={css("margin-top:22px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;")}>
            {s.previewStatus !== "loading" && (
              <button onClick={() => previewStandard()} style={css("background:#fff;color:#0f4c9c;border:1px solid #0f4c9c;border-radius:999px;padding:11px 22px;font-size:14px;font-weight:600;cursor:pointer;")}>{s.previewStatus === "done" ? "↻ Refresh preview" : "Preview standard"}</button>
            )}
            {s.genStatus !== "processing" && (
              <button onClick={() => generate()} className="hh-primary" style={css("background:#1f7a4d;color:#fff;border:none;border-radius:999px;padding:11px 26px;font-size:14px;font-weight:600;cursor:pointer;")}>Generate documents</button>
            )}
            {(s.previewStatus === "loading" || s.genStatus === "processing") && (
              <div style={css("display:flex;align-items:center;gap:10px;font-size:13px;color:#57534E;")}>
                <div style={css("width:18px;height:18px;border:3px solid #dfe6ef;border-top-color:#0f4c9c;border-radius:50%;animation:hh-spin .8s linear infinite;")} />
                {s.genStatus === "processing" ? "Fetching the live benchmark and generating…" : "Drafting the standard…"}
              </div>
            )}
          </div>

          {s.previewStatus === "failed" && <div style={css("margin-top:12px;font-size:13px;color:#b4381f;")}>Preview failed — {s.previewError}</div>}
          {s.previewStatus === "done" && <div style={css("margin-top:20px;")}><PolicyPreview /></div>}

          {s.genStatus === "failed" && <div style={css("margin-top:16px;font-size:13px;color:#b4381f;")}>Generation failed — {s.genError}</div>}
          {s.genStatus === "done" && (
            <div style={css("margin-top:20px;border:1px solid #cfe0d6;background:#f0f7f3;border-radius:16px;padding:20px;max-width:560px;")}>
              <div style={css("font-size:15px;font-weight:600;color:#186340;margin-bottom:4px;")}>✓ Documents ready</div>
              <div style={css("font-size:13px;color:#57534E;margin-bottom:16px;")}>{s.genArtifacts.length} artifacts generated from the live source · saved to your library.</div>
              <div style={css("display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;")}>
                {s.genArtifacts.map((a) => (
                  <a key={a.format} href={a.url} style={css("font-size:12px;font-family:'Fragment Mono',monospace;background:#F1F2EA;color:#0f4c9c;padding:6px 12px;border-radius:6px;font-weight:600;text-decoration:none;")}>↓ {a.format}</a>
                ))}
              </div>
              <button onClick={() => go("library")} style={css("background:#0f4c9c;color:#fff;border:none;border-radius:8px;padding:12px 22px;font-size:14px;font-weight:600;cursor:pointer;")}>Go to library →</button>
            </div>
          )}
        </div>
            )}
          </>
        )}
      </div>

      {/* ── Security standards & policies (NIST, ISO, PCI…) ── */}
      <div style={css(sectionCard)}>
        <h3 style={css(sectionTitle)}>Security standards &amp; policies</h3>
        <p style={css("margin:0 0 16px;color:#79716B;font-size:12.5px;")}>NIST, ISO, PCI and other standards you’ve purchased. Generate your branded copy into the Library.</p>
        <OwnedStandards />
      </div>
    </div>
  );
}
