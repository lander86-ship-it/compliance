"use client";

import React from "react";
import { css } from "@/lib/hub/theme";
import { BUNDLES } from "@/lib/hub/data";
import { useHub } from "@/lib/hub/store";

type UsageUser = { id: string; email: string; name: string | null; role: string; createdAt: string; bundles: string[] };
type UsageEvent = { id: string; userEmail: string | null; source: string; guideName: string | null; formats: string | null; createdAt: string };
type Usage = { users: UsageUser[]; events: UsageEvent[]; totals: { users: number; generations: number; entitlements: number } };

const bundleName = (id: string) => BUNDLES.find((b) => b.id === id)?.name || id;
const fmtDate = (s: string) => { try { return new Date(s).toISOString().slice(0, 16).replace("T", " "); } catch { return s; } };

type DemoAccount = { role: string; email: string; password: string };

export function AdminUsage() {
  const { s } = useHub();
  const [data, setData] = React.useState<Usage | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [demo, setDemo] = React.useState<DemoAccount[] | null>(null);
  const [seeding, setSeeding] = React.useState(false);

  const seedDemo = React.useCallback(() => {
    setSeeding(true);
    fetch("/api/admin/seed-demo", { method: "POST" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))))
      .then((d) => setDemo(d.accounts || []))
      .catch(() => setDemo(null))
      .finally(() => setSeeding(false));
  }, []);

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/admin/usage")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status === 403 ? "Admin access required." : `Failed (${r.status})`))))
      .then((d) => { setData(d); setError(null); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const card = "background:#FBFAF9;border:1px solid #E7E6E5;border-radius:20px;padding:18px;";
  const th = "text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#79716B;font-weight:700;padding:10px 12px;border-bottom:1px solid #E7E6E5;";
  const td = "font-size:13px;padding:10px 12px;border-bottom:1px solid #EFEEEC;vertical-align:top;";

  return (
    <div style={css(`max-width:1180px;${s.isMobile ? "padding:18px 14px 48px;" : "padding:26px 34px 60px;"}`)}>
      <div style={css("display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:16px;flex-wrap:wrap;")}>
        <h1 style={css("margin:0;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>Usage &amp; customers</h1>
        <div style={css("display:flex;gap:8px;")}>
          <button onClick={seedDemo} disabled={seeding} style={css("background:#0f4c9c;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;")}>{seeding ? "Creating…" : "Create demo accounts"}</button>
          <button onClick={load} style={css("background:#fff;border:1px solid #E7E6E5;color:#57534E;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;")}>↻ Refresh</button>
        </div>
      </div>

      {demo && (
        <div style={css("border:1px solid #cfe0d6;background:#f0f7f3;border-radius:12px;padding:16px 18px;margin-bottom:20px;")}>
          <div style={css("font-size:13px;font-weight:700;color:#186340;margin-bottom:10px;")}>Demo accounts ready — sign out and log in with these to test each view:</div>
          {demo.map((a) => (
            <div key={a.email} style={css("font-size:12.5px;color:#1C1917;margin-bottom:6px;font-family:'Fragment Mono',monospace;")}>
              <strong>{a.role}:</strong> {a.email} / {a.password}
            </div>
          ))}
          <div style={css("font-size:11.5px;color:#57534E;margin-top:8px;")}>The client already owns a full (simulated) purchase, so you can go straight to “Generate a guide”. Real new users pay via Stripe.</div>
        </div>
      )}

      {loading && <div style={css("color:#79716B;font-size:14px;")}>Loading usage…</div>}
      {error && <div style={css("border:1px solid #e6c9b8;background:#fbf3ec;border-radius:12px;padding:16px;color:#b4381f;font-size:14px;")}>{error}</div>}

      {data && (
        <>
          <div style={css(`display:grid;grid-template-columns:repeat(${s.isMobile ? 1 : 3},1fr);gap:16px;margin-bottom:24px;`)}>
            {[["Customers", data.totals.users], ["Guides generated", data.totals.generations], ["Active entitlements", data.totals.entitlements]].map(([k, v]) => (
              <div key={k} style={css(card)}>
                <div style={css("font-size:12px;color:#79716B;margin-bottom:8px;")}>{k}</div>
                <div style={css("font-size:28px;font-weight:700;color:#1C1917;font-family:'Fragment Mono',monospace;")}>{v}</div>
              </div>
            ))}
          </div>

          <div style={css("display:grid;grid-template-columns:1fr;gap:22px;")}>
            <div style={css(card + "padding:0;overflow:hidden;")}>
              <h3 style={css("margin:0;font-size:15px;font-weight:600;padding:16px 18px;border-bottom:1px solid #E7E6E5;")}>Customers &amp; entitlements</h3>
              <div style={css("overflow-x:auto;")}>
                <table style={css("width:100%;border-collapse:collapse;min-width:640px;")}>
                  <thead><tr><th style={css(th)}>User</th><th style={css(th)}>Role</th><th style={css(th)}>Owns bundles</th><th style={css(th)}>Joined</th></tr></thead>
                  <tbody>
                    {data.users.length === 0 && <tr><td style={css(td + "color:#79716B;")} colSpan={4}>No customers yet.</td></tr>}
                    {data.users.map((u) => (
                      <tr key={u.id}>
                        <td style={css(td)}><div style={css("font-weight:600;")}>{u.name || u.email}</div><div style={css("font-size:11.5px;color:#79716B;")}>{u.email}</div></td>
                        <td style={css(td)}><span style={css(`font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;${u.role === "owner" || u.role === "admin" ? "background:#eef4fb;color:#0f4c9c;" : "background:#F1F2EA;color:#57534E;"}`)}>{u.role}</span></td>
                        <td style={css(td)}>{u.bundles.length ? u.bundles.map((b) => <div key={b} style={css("font-size:12.5px;")}>{bundleName(b)}</div>) : <span style={css("color:#79716B;")}>—</span>}</td>
                        <td style={css(td + "font-family:'Fragment Mono',monospace;color:#57534E;font-size:12px;")}>{fmtDate(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={css(card + "padding:0;overflow:hidden;")}>
              <h3 style={css("margin:0;font-size:15px;font-weight:600;padding:16px 18px;border-bottom:1px solid #E7E6E5;")}>Recent generations</h3>
              <div style={css("overflow-x:auto;")}>
                <table style={css("width:100%;border-collapse:collapse;min-width:640px;")}>
                  <thead><tr><th style={css(th)}>When</th><th style={css(th)}>User</th><th style={css(th)}>Source</th><th style={css(th)}>Guide</th><th style={css(th)}>Formats</th></tr></thead>
                  <tbody>
                    {data.events.length === 0 && <tr><td style={css(td + "color:#79716B;")} colSpan={5}>No guides generated yet.</td></tr>}
                    {data.events.map((e) => (
                      <tr key={e.id}>
                        <td style={css(td + "font-family:'Fragment Mono',monospace;color:#57534E;font-size:12px;white-space:nowrap;")}>{fmtDate(e.createdAt)}</td>
                        <td style={css(td)}>{e.userEmail || "—"}</td>
                        <td style={css(td)}><span style={css(`font-size:11px;font-weight:700;text-transform:uppercase;color:${e.source === "cis" ? "#0f4c9c" : e.source === "disa" ? "#186340" : "#79716B"};`)}>{e.source}</span></td>
                        <td style={css(td)}>{e.guideName || "—"}</td>
                        <td style={css(td + "font-family:'Fragment Mono',monospace;font-size:11.5px;color:#57534E;")}>{e.formats || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
