"use client";

import React from "react";
import { useHub } from "@/lib/hub/store";
import { css, fwStyle, sevStyle, profStyle } from "@/lib/hub/theme";
import { findItem, MAPPINGS, SAMPLE, PRODUCTS, type Bundle } from "@/lib/hub/data";

export function Product() {
  const { s, set, go, addToCart } = useHub();
  const base = findItem(s.selectedId) || PRODUCTS[0];
  const isBundle = "includes" in base && Array.isArray((base as Bundle).includes);
  const b = base as Bundle;
  const framework = isBundle ? "PACK" : (base as (typeof PRODUCTS)[number]).framework;
  const platform = isBundle ? "Bundle" : (base as (typeof PRODUCTS)[number]).platform;
  const blurb = isBundle ? b.tagline : (base as (typeof PRODUCTS)[number]).blurb;
  const savings = base.savings;
  const price = base.price;

  const stats = isBundle
    ? [ { k: "Type", v: "Package" }, { k: "Included guides", v: String(b.count) }, { k: "Updated", v: "Jun 2026" }, { k: "Savings", v: savings } ]
    : [ { k: "Source version", v: (base as (typeof PRODUCTS)[number]).version }, { k: "Controls", v: String((base as (typeof PRODUCTS)[number]).controls) }, { k: "Updated", v: "Jun 2026" }, { k: "Type", v: (base as (typeof PRODUCTS)[number]).type } ];

  const buyNow = () => set((p) => ({ cart: p.cart.includes(base.id) ? p.cart : [...p.cart, base.id], view: "cart" }));

  return (
    <div style={css("padding:20px 34px 60px;max-width:1120px;")}>
      <div style={css("font-size:12px;color:#79716B;margin-bottom:16px;font-family:'Fragment Mono',monospace;")}>
        <span onClick={() => go("storefront")} style={css("cursor:pointer;color:#1663d6;")}>Catalog</span> / {framework} / {platform}
      </div>
      <div style={css("display:grid;grid-template-columns:1fr 336px;gap:30px;align-items:start;")}>
        <div>
          <span style={css(fwStyle(framework))}>{framework}</span>
          <h1 style={css("margin:12px 0 8px;font-size:27px;font-weight:700;letter-spacing:-.4px;line-height:1.2;")}>{base.name}</h1>
          <p style={css("margin:0 0 20px;color:#57534E;font-size:14.5px;line-height:1.6;")}>{blurb}</p>

          <div style={css("display:flex;gap:0;border:1px solid #E7E6E5;border-radius:16px;overflow:hidden;margin-bottom:26px;background:#FBFAF9;")}>
            {stats.map((st) => (
              <div key={st.k} style={css("flex:1;padding:14px 16px;border-right:1px solid #EFEEEC;")}>
                <div style={css("font-size:11px;color:#79716B;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;")}>{st.k}</div>
                <div style={css("font-size:15px;font-weight:600;font-family:'Fragment Mono',monospace;")}>{st.v}</div>
              </div>
            ))}
          </div>

          {isBundle ? (
            <>
              <h3 style={css("font-size:15px;font-weight:600;margin:0 0 12px;")}>What&apos;s included in this package</h3>
              <div style={css("border:1px solid #E7E6E5;border-radius:16px;overflow:hidden;margin-bottom:28px;background:#FBFAF9;")}>
                {b.includes.map((name) => (
                  <div key={name} style={css("display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid #EFEEEC;font-size:13.5px;")}>
                    <span style={css("color:#1f7a4d;font-weight:700;")}>✓</span>
                    {name}
                  </div>
                ))}
              </div>
              <div style={css("background:#F1F2EA;border:1px solid #E7E6E5;border-radius:16px;padding:16px 18px;font-size:12.5px;color:#0f4c9c;line-height:1.55;")}>Every guide in this package is fully customizable in the Scope Wizard — apply your branding, include/exclude controls, and generate DOCX/PDF/XLSX per platform.</div>
            </>
          ) : (
            <>
              <h3 style={css("font-size:15px;font-weight:600;margin:0 0 12px;")}>Cross-framework mappings</h3>
              <div style={css("border:1px solid #E7E6E5;border-radius:16px;overflow:hidden;margin-bottom:28px;background:#FBFAF9;")}>
                <div style={css("display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;background:#F1F2EA;border-bottom:1px solid #E7E6E5;padding:9px 14px;font-size:11px;font-weight:600;color:#79716B;text-transform:uppercase;letter-spacing:.4px;")}>
                  <div>This control</div><div>NIST 800-53</div><div>NIST CSF</div><div>ISO 27002</div>
                </div>
                {MAPPINGS.map((m) => (
                  <div key={m.src} style={css("display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;padding:10px 14px;font-size:12.5px;font-family:'Fragment Mono',monospace;border-bottom:1px solid #EFEEEC;")}>
                    <div style={css("color:#1C1917;")}>{m.src}</div>
                    <div style={css("color:#1663d6;")}>{m.nist}</div>
                    <div style={css("color:#1663d6;")}>{m.csf}</div>
                    <div style={css("color:#1663d6;")}>{m.iso}</div>
                  </div>
                ))}
              </div>

              <h3 style={css("font-size:15px;font-weight:600;margin:0 0 4px;")}>
                Control preview <span style={css("font-weight:400;color:#79716B;font-size:12px;")}>· watermarked sample</span>
              </h3>
              <div style={css("position:relative;")}>
                <div style={css("position:absolute;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center;z-index:2;")}>
                  <span style={css("font-size:52px;font-weight:700;color:rgba(20,45,90,.05);transform:rotate(-16deg);font-family:'Fragment Mono',monospace;letter-spacing:6px;")}>PREVIEW · HARDENHUB</span>
                </div>
                {SAMPLE.map((c) => (
                  <div key={c.id} style={css("border:1px solid #E7E6E5;border-radius:16px;padding:16px 18px;margin-top:12px;background:#FBFAF9;")}>
                    <div style={css("display:flex;align-items:center;gap:10px;margin-bottom:8px;")}>
                      <span style={css("font-family:'Fragment Mono',monospace;font-size:12px;font-weight:600;color:#1C1917;background:#F1F2EA;padding:2px 7px;border-radius:4px;")}>{c.id}</span>
                      <span style={css(sevStyle(c.severity))}>{c.severity}</span>
                      <span style={css(profStyle())}>{c.profile}</span>
                    </div>
                    <div style={css("font-size:14px;font-weight:600;margin-bottom:8px;")}>{c.title}</div>
                    <div style={css("font-size:12.5px;color:#57534E;line-height:1.55;")}>
                      <b style={css("color:#1C1917;")}>Rationale.</b> {c.rationale}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* buy box */}
        <div style={css("position:sticky;top:20px;background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;padding:20px;box-shadow:0 4px 16px rgba(20,45,90,.06);")}>
          <div style={css("font-size:30px;font-weight:700;color:#1C1917;")}>{price}</div>
          <div style={css("font-size:12px;color:#1f7a4d;font-weight:600;margin:4px 0 18px;")}>Est. savings vs. in-house authoring: {savings}</div>

          {!isBundle ? (
            <>
              <div style={css("font-size:12px;font-weight:600;color:#57534E;margin-bottom:6px;")}>OS / platform version</div>
              <div style={css("display:flex;flex-direction:column;gap:6px;margin-bottom:16px;")}>
                {["Windows Server 2022", "Windows Server 2019"].map((l) => {
                  const on = s.variant === l;
                  return (
                    <button key={l} onClick={() => set({ variant: l })} style={css(`text-align:left;background:${on ? "#F1F2EA" : "#fff"};border:1px solid ${on ? "#0f4c9c" : "#E7E6E5"};color:#1C1917;border-radius:7px;padding:9px 12px;font-size:13px;cursor:pointer;font-weight:${on ? 600 : 400};`)}>{l}</button>
                  );
                })}
              </div>
              <div style={css("font-size:12px;font-weight:600;color:#57534E;margin-bottom:6px;")}>Profile</div>
              <div style={css("display:flex;gap:6px;margin-bottom:20px;")}>
                {["Level 1", "Level 2"].map((l) => {
                  const on = s.profile === l;
                  return (
                    <button key={l} onClick={() => set({ profile: l })} style={css(`flex:1;background:${on ? "#0f4c9c" : "#fff"};color:${on ? "#fff" : "#57534E"};border:1px solid ${on ? "#0f4c9c" : "#E7E6E5"};border-radius:7px;padding:9px;font-size:13px;font-weight:600;cursor:pointer;`)}>{l}</button>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={css("display:flex;align-items:center;gap:10px;margin-bottom:20px;padding:11px 14px;background:#F1F2EA;border-radius:8px;font-size:12.5px;color:#57534E;")}>
              <span style={css("font-family:'Fragment Mono',monospace;font-weight:600;color:#0f4c9c;")}>{b.count}</span> guides · one-organization license · per-guide scoping
            </div>
          )}

          <button onClick={buyNow} className="hh-primary" style={css("width:100%;background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:13px 24px;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:9px;")}>Buy now</button>
          <button onClick={() => addToCart(base.id)} style={css("width:100%;background:#FBFAF9;color:#0f4c9c;border:1px solid #E7E6E5;border-radius:999px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer;")}>Add to cart</button>

          <div style={css("margin-top:18px;padding-top:16px;border-top:1px solid #EFEEEC;font-size:12px;color:#57534E;line-height:1.9;")}>
            <div>✓ DOCX · PDF · XLSX output</div>
            <div>✓ Your logo &amp; branding</div>
            <div>✓ Include/exclude with justification</div>
            <div>✓ 1-year update subscription</div>
          </div>
        </div>
      </div>
    </div>
  );
}
