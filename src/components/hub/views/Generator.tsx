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
    <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:22px;")}>
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

function GuideSearch() {
  const { s, searchGuides, selectGuide } = useHub();
  const { guideAllowed } = useAllowed();
  const [q, setQ] = React.useState("");
  const submit = () => searchGuides(q.trim());
  const results = s.guideResults.filter((g) => guideAllowed(g.source, g.name));
  return (
    <>
      <div style={css("display:flex;gap:10px;margin-bottom:14px;")}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder={`Search ${s.source === "cis" ? "CIS Benchmarks" : "DISA STIGs"} — e.g. "RHEL", "Windows", "Cisco"…`}
          style={css("flex:1;border:1px solid #E7E6E5;border-radius:9px;padding:12px 14px;font-size:14px;outline:none;")}
        />
        <button onClick={submit} className="hh-primary" style={css("background:#0f4c9c;color:#fff;border:none;border-radius:9px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer;")}>Search</button>
      </div>

      {!s.guideAvailable && (
        <div style={css("border:1px solid #e6c9b8;background:#fbf3ec;border-radius:12px;padding:14px 16px;font-size:13px;color:#8a5a00;margin-bottom:14px;")}>
          {s.guideDetail || "This source is not connected yet."}
        </div>
      )}
      {s.guideStatus === "loading" && (
        <div style={css("display:flex;align-items:center;gap:12px;font-size:13px;color:#57534E;padding:12px 0;")}>
          <div style={css("width:18px;height:18px;border:3px solid #dfe6ef;border-top-color:#0f4c9c;border-radius:50%;animation:hh-spin .8s linear infinite;")} />
          Searching the live catalog…
        </div>
      )}
      {s.guideStatus === "failed" && (
        <div style={css("font-size:13px;color:#b4381f;padding:8px 0;")}>Search failed — {s.guideError}</div>
      )}
      {s.guideStatus === "done" && results.length === 0 && s.guideAvailable && (
        <div style={css("font-size:13px;color:#79716B;padding:8px 0;")}>{s.guideResults.length > 0 ? "Matches found, but none are in your purchased categories." : "No benchmarks matched. Try a broader term."}</div>
      )}
      {results.length > 0 && (
        <div style={css("border:1px solid #E7E6E5;border-radius:14px;overflow:hidden;max-height:340px;overflow-y:auto;")}>
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
      <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:12px;")}>
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

export function Generator() {
  const { s, previewStandard, generate, go } = useHub();
  const { admin, ent } = useAllowed();
  const g = s.selectedGuide;
  const hasAccess = admin || (ent && (ent.all || ent.sources.length > 0));

  return (
    <div style={css("max-width:900px;margin:0 auto;padding:30px 40px;")}>
      <h2 style={css("margin:0 0 4px;font-size:24px;font-weight:800;")}>Generate a hardening guide</h2>
      <p style={css("margin:0 0 24px;color:#57534E;font-size:14px;")}>Connect to your source, pick a benchmark, and the AI drafts a customised standard in your own template — on demand, always the current release.</p>

      {!hasAccess && (
        <div style={css("border:1px solid #e6c9b8;background:#fbf3ec;border-radius:14px;padding:20px;margin-bottom:22px;")}>
          <div style={css("font-size:15px;font-weight:700;color:#8a5a00;margin-bottom:4px;")}>You don’t have generation access yet</div>
          <div style={css("font-size:13px;color:#57534E;margin-bottom:14px;line-height:1.5;")}>Purchase an access bundle to generate CIS and DISA guides for the platforms you need. Your account unlocks generation for the categories you buy.</div>
          <button onClick={() => go("storefront")} className="hh-primary" style={css("background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:11px 22px;font-size:14px;font-weight:600;cursor:pointer;")}>Browse access bundles →</button>
        </div>
      )}
      {hasAccess && ent && !ent.all && !admin && (
        <div style={css("font-size:12px;color:#57534E;margin-bottom:14px;")}>Your plan: <strong>{ent.sources.map((x) => x.toUpperCase()).join(" + ")}</strong>{ent.categories.length ? ` · ${ent.categories.join(", ")}` : ""}.</div>
      )}

      <SourcePicker />
      <GuideSearch />

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
    </div>
  );
}
