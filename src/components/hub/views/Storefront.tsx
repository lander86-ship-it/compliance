"use client";

import React from "react";
import { useHub } from "@/lib/hub/store";
import { css } from "@/lib/hub/theme";
import { Icon } from "../Icon";
import { FAMILIES, BUNDLES, DIRECTORY } from "@/lib/hub/data";

const heroFeatures = [
  { label: "Built on CIS Benchmarks & DISA STIGs", icon: "shield" },
  { label: "Cross-mapped to NIST & ISO 27002", icon: "map" },
  { label: "Scope & brand in the Wizard", icon: "sliders" },
  { label: "Export DOCX · PDF · XLSX", icon: "fileDown" },
];

export function Storefront() {
  const { s, set, open } = useHub();
  const family = s.family;
  const af = FAMILIES.find((f) => f.id === family)!;
  const bundles = BUNDLES.filter((b) => b.family === family);
  const flagship = bundles.find((b) => b.featured) || bundles[0];
  const directory = DIRECTORY[family];

  return (
    <>
      {/* HERO */}
      <div style={css("background:#F1F2EA;color:#1C1917;padding:54px 34px 48px;position:relative;overflow:hidden;border-bottom:1px solid #E7E6E5;")}>
        <div style={css("position:absolute;inset:0;opacity:.6;pointer-events:none;background-image:radial-gradient(#E1E0D8 1px,transparent 1px);background-size:22px 22px;")} />
        <div style={css("max-width:1180px;position:relative;")}>
          <div style={css("display:flex;align-items:center;gap:9px;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#C9443A;margin-bottom:18px;font-family:'Fragment Mono',monospace;")}>
            <Icon name="shield" size={15} />
            Security configuration baselines
          </div>
          <h1 style={css("margin:0 0 16px;font-size:42px;font-weight:700;letter-spacing:-.03em;line-height:1.06;max-width:760px;color:#1C1917;")}>Audit-ready hardening standards for every platform you run</h1>
          <p style={css("margin:0 0 30px;font-size:16px;line-height:1.6;color:#57534E;max-width:650px;")}>HardenHub turns CIS Benchmarks and DISA STIGs into branded, scoped, board-ready security documents — mapped to NIST 800-53, NIST CSF and ISO 27002, and exported to DOCX, PDF and XLSX in minutes instead of weeks.</p>
          <div style={css("display:flex;flex-wrap:wrap;gap:11px;")}>
            {heroFeatures.map((hf) => (
              <div key={hf.label} style={css("display:flex;align-items:center;gap:9px;background:#FBFAF9;border:1px solid #E7E6E5;border-radius:999px;padding:10px 17px 10px 14px;font-size:13px;font-weight:500;color:#57534E;box-shadow:0 1px 2px rgba(28,25,23,.04);")}>
                <span style={css("color:#0f4c9c;display:inline-flex;")}>
                  <Icon name={hf.icon} />
                </span>
                {hf.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={css("padding:26px 34px 60px;max-width:1180px;")}>
        <h1 style={css("margin:0 0 4px;font-size:26px;font-weight:700;letter-spacing:-.4px;")}>Catalog</h1>
        <p style={css("margin:0 0 20px;color:#57534E;font-size:14px;")}>Two product lines, sold as packages. Pick a family, then a pack.</p>

        {/* family selector */}
        <div style={css("display:flex;gap:14px;background:#e3e9f1;border-radius:22px;padding:8px;margin-bottom:26px;")}>
          {FAMILIES.map((f) => {
            const on = family === f.id;
            return (
              <button
                key={f.id}
                onClick={() => set({ family: f.id })}
                style={css(`flex:1;text-align:left;background:${on ? "#fff" : "transparent"};border:1px solid ${on ? "#c3d2ea" : "transparent"};border-radius:16px;padding:14px 18px;cursor:pointer;box-shadow:${on ? "0 2px 10px rgba(20,45,90,.07)" : "none"};`)}
              >
                <div style={css(`font-size:15px;font-weight:600;color:${on ? "#1C1917" : "#57534E"};margin-bottom:3px;`)}>{f.label}</div>
                <div style={css("font-size:12px;color:#79716B;line-height:1.4;")}>{f.desc}</div>
              </button>
            );
          })}
        </div>

        <div style={css("display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px;")}>
          <h2 style={css("margin:0;font-size:16px;font-weight:600;")}>{af.label} — packages</h2>
          <span style={css("font-size:12px;color:#79716B;font-family:'Fragment Mono',monospace;")}>buy as a pack · save vs. individual</span>
        </div>

        {/* bundle grid */}
        <div style={css("display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:40px;")}>
          {bundles.map((b) => (
            <div
              key={b.id}
              onClick={() => set({ view: "product", selectedId: b.id })}
              className="hh-lift"
              style={css(`background:#FBFAF9;border:1px solid ${b.featured ? "#0f4c9c" : "#E7E6E5"};border-radius:22px;padding:20px;cursor:pointer;display:flex;flex-direction:column;position:relative;box-shadow:${b.featured ? "0 6px 22px rgba(20,45,90,.10)" : "none"};`)}
            >
              {b.featured && <div style={css("position:absolute;top:-9px;left:18px;background:#E4544B;color:#fff;font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;padding:3px 9px;border-radius:20px;")}>Best value</div>}
              <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;")}>
                <span style={css("display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;font-family:'Fragment Mono',monospace;color:#0f4c9c;background:#F1F2EA;padding:3px 9px 3px 7px;border-radius:5px;")}>
                  <Icon name="Bundles" size={13} />
                  PACKAGE
                </span>
                <span style={css("font-size:11px;font-family:'Fragment Mono',monospace;color:#79716B;")}>{b.count} items</span>
              </div>
              <div style={css("font-size:16px;font-weight:700;line-height:1.3;margin-bottom:6px;")}>{b.name}</div>
              <div style={css("font-size:12.5px;color:#57534E;line-height:1.5;margin-bottom:14px;min-height:52px;")}>{b.tagline}</div>
              <div style={css("border-top:1px solid #EFEEEC;padding-top:12px;margin-bottom:12px;")}>
                {b.includes.slice(0, 4).map((t) => (
                  <div key={t} style={css("font-size:12px;color:#57534E;line-height:1.7;display:flex;gap:7px;")}>
                    <span style={css("color:#1f7a4d;")}>✓</span>
                    {t}
                  </div>
                ))}
              </div>
              <div style={css("flex:1;")} />
              <div style={css("display:flex;justify-content:space-between;align-items:center;")}>
                <div>
                  <div style={css("font-size:10px;color:#79716B;text-transform:uppercase;letter-spacing:.4px;")}>from</div>
                  <div style={css("font-size:21px;font-weight:700;color:#1C1917;")}>{b.price}</div>
                </div>
                <div style={css("font-size:11px;color:#1f7a4d;font-weight:600;background:#e7f4ee;padding:3px 9px;border-radius:20px;")}>saves {b.savings}</div>
              </div>
            </div>
          ))}
        </div>

        {/* full directory */}
        <div style={css("display:flex;align-items:baseline;justify-content:space-between;margin-bottom:16px;")}>
          <h2 style={css("margin:0;font-size:16px;font-weight:600;")}>Everything included in {af.label}</h2>
          <span style={css("font-size:12px;color:#79716B;")}>available across the packages above</span>
        </div>
        <div style={css("display:grid;grid-template-columns:repeat(3,1fr);gap:28px 34px;background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;padding:26px 28px;")}>
          {directory.map((c) => (
            <div key={c.cat}>
              <div style={css("font-size:13px;font-weight:600;color:#1C1917;border-left:3px solid #0f4c9c;padding-left:10px;margin-bottom:12px;")}>{c.cat}</div>
              {c.items.map((name) => (
                <div key={name} onClick={() => set({ view: "product", selectedId: flagship.id })} style={css("font-size:13px;color:#57534E;line-height:1.55;padding:3px 0;cursor:pointer;")}>
                  {name}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
