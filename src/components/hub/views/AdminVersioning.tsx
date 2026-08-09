"use client";

import React, { useEffect, useState } from "react";
import { css } from "@/lib/hub/theme";

type Event = { id: string; source: string; guideName: string | null; createdAt: string };
type Group = { name: string; source: string; revisions: number; first: string; last: string };

const fmt = (s: string) => { try { return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); } catch { return s; } };

// Real "versioning" = the revision history of every standard produced by the
// platform, grouped by guide, from the generation audit trail.
export function AdminVersioning() {
  const [groups, setGroups] = useState<Group[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/usage").then((r) => (r.ok ? r.json() : { events: [] })).then((d) => {
      const byGuide = new Map<string, Group>();
      for (const e of (d.events || []) as Event[]) {
        const name = e.guideName || "(unnamed)";
        const key = `${e.source}::${name}`;
        const g = byGuide.get(key);
        if (!g) byGuide.set(key, { name, source: e.source, revisions: 1, first: e.createdAt, last: e.createdAt });
        else { g.revisions++; if (e.createdAt < g.first) g.first = e.createdAt; if (e.createdAt > g.last) g.last = e.createdAt; }
      }
      setGroups([...byGuide.values()].sort((a, b) => (a.last < b.last ? 1 : -1)));
    }).catch(() => setGroups([]));
  }, []);

  return (
    <div style={css("padding:26px 34px 60px;max-width:980px;")}>
      <h1 style={css("margin:0 0 4px;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>Versioning &amp; updates</h1>
      <p style={css("margin:0 0 22px;color:#57534E;font-size:14px;")}>Revision history of every standard generated on the platform. Guides always pull the current release from the live source, so re-generating produces the latest version.</p>

      {groups === null ? (
        <div style={css("color:#79716B;font-size:14px;padding:30px 0;")}>Loading version history…</div>
      ) : groups.length === 0 ? (
        <div style={css("background:#FBFAF9;border:1px dashed #D6D3D1;border-radius:20px;padding:44px;text-align:center;color:#79716B;font-size:14px;")}>No standards generated yet. Version history appears here as guides are produced.</div>
      ) : (
        <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:22px;overflow:hidden;")}>
          <div style={css("display:grid;grid-template-columns:80px 1fr 110px 130px 130px;background:#F1F2EA;border-bottom:1px solid #E7E6E5;padding:11px 18px;font-size:11px;font-weight:600;color:#79716B;text-transform:uppercase;letter-spacing:.4px;")}>
            <div>Source</div><div>Standard</div><div>Revisions</div><div>First</div><div>Latest</div>
          </div>
          {groups.map((g, i) => (
            <div key={i} style={css("display:grid;grid-template-columns:80px 1fr 110px 130px 130px;padding:14px 18px;border-bottom:1px solid #EFEEEC;font-size:13px;align-items:center;")}>
              <div><span style={css(`font-size:11px;font-weight:700;text-transform:uppercase;color:${g.source === "cis" ? "#0f4c9c" : g.source === "disa" ? "#186340" : "#79716B"};`)}>{g.source}</span></div>
              <div style={css("font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;")}>{g.name}</div>
              <div style={css("font-family:'Fragment Mono',monospace;color:#57534E;")}>{g.revisions}</div>
              <div style={css("color:#57534E;font-family:'Fragment Mono',monospace;font-size:12px;")}>{fmt(g.first)}</div>
              <div style={css("color:#57534E;font-family:'Fragment Mono',monospace;font-size:12px;")}>{fmt(g.last)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
