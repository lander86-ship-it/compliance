"use client";

import React, { useState } from "react";
import { css, statusPill } from "@/lib/hub/theme";
import { Icon } from "../Icon";

type Art = { format: string; url: string; bytes: number };

// A single free sample guide, branded for the fictional client "HardenHubCo",
// so visitors can see the real output before buying. Uses the public demo
// baseline (no subscription required).
const FREE = {
  name: "CIS Windows Server — Security Baseline (sample)",
  client: "HardenHubCo",
  productId: "cis-win2022",
  blurb: "A full sample hardening guide generated for the demo client HardenHubCo — same engine, layout and cross-mappings as the paid guides.",
};

export function FreeGuides() {
  const [status, setStatus] = useState<"idle" | "gen" | "done" | "err">("idle");
  const [arts, setArts] = useState<Art[]>([]);
  const [err, setErr] = useState("");

  const generate = async () => {
    setStatus("gen"); setErr("");
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId: FREE.productId,
          scope: { legal: FREE.client, trade: "HardenHubCo", owner: "HardenHubCo Security", profile: "Level 1", classification: "Public sample" },
          formats: ["DOCX", "PDF"],
        }),
      });
      if (!r.ok) throw new Error(`Generation failed (${r.status})`);
      const d = await r.json();
      setArts(d.artifacts || []);
      setStatus("done");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Generation failed");
      setStatus("err");
    }
  };

  const artChip = "font-size:12px;font-family:'Fragment Mono',monospace;background:#F1F2EA;color:#0f4c9c;padding:6px 12px;border-radius:6px;font-weight:600;text-decoration:none;";

  return (
    <div style={css("max-width:820px;padding:26px 34px 60px;")}>
      <h1 style={css("margin:0 0 4px;font-size:26px;font-weight:700;letter-spacing:-.4px;")}>Free guides</h1>
      <p style={css("margin:0 0 22px;color:#57534E;font-size:14px;")}>Try the generator with a complete sample document — no account required.</p>

      <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;padding:24px;")}>
        <div style={css("display:flex;align-items:center;gap:10px;margin-bottom:10px;")}>
          <span style={css("display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;font-family:'Fragment Mono',monospace;color:#1f7a4d;background:#e7f4ee;padding:3px 10px;border-radius:5px;")}><Icon name="shield" size={13} /> FREE SAMPLE</span>
          <span style={css(statusPill("#0f4c9c"))}>Client: {FREE.client}</span>
        </div>
        <div style={css("font-size:18px;font-weight:700;margin-bottom:8px;")}>{FREE.name}</div>
        <p style={css("margin:0 0 20px;color:#57534E;font-size:13.5px;line-height:1.6;")}>{FREE.blurb}</p>

        {status !== "done" ? (
          <button onClick={generate} disabled={status === "gen"} className="hh-primary" style={css(`background:${status === "gen" ? "#7fa4d0" : "#0f4c9c"};color:#fff;border:none;border-radius:999px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer;`)}>
            {status === "gen" ? "Generating…" : "Generate & download free sample"}
          </button>
        ) : (
          <div>
            <div style={css("font-size:13px;color:#186340;font-weight:600;margin-bottom:10px;")}>✓ Your sample is ready — download below.</div>
            <div style={css("display:flex;gap:10px;flex-wrap:wrap;")}>
              {arts.map((a) => (<a key={a.format} href={a.url} style={css(artChip)}>↓ {a.format}</a>))}
            </div>
          </div>
        )}
        {status === "err" && <div style={css("margin-top:12px;font-size:13px;color:#8a3b3b;")}>{err}</div>}
      </div>
    </div>
  );
}
