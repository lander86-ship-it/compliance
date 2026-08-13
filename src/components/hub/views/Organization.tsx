"use client";

import React from "react";
import { useHub } from "@/lib/hub/store";
import { css } from "@/lib/hub/theme";

type Member = { id: string; email: string; name: string | null; orgRole: string | null };
type Org = {
  id: string;
  legalName: string;
  tradeName: string | null;
  taxId: string | null;
  country: string | null;
  role: string;
  members: Member[];
  invites: { email: string }[];
};

const card = "background:#FBFAF9;border:1px solid #E7E6E5;border-radius:20px;padding:22px;margin-bottom:20px;";
const input = "width:100%;padding:11px 13px;border:1px solid #E7E6E5;border-radius:10px;font-size:14px;background:#fff;outline:none;box-sizing:border-box;";
const label = "font-size:12px;font-weight:600;color:#57534E;margin-bottom:6px;display:block;";

export function Organization() {
  const { s, loadEntitlements } = useHub();
  const [org, setOrg] = React.useState<Org | null | undefined>(undefined); // undefined = loading
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

  // Create-org form
  const [legalName, setLegalName] = React.useState("");
  const [taxId, setTaxId] = React.useState("");
  const [country, setCountry] = React.useState("");
  // Invite form
  const [inviteEmail, setInviteEmail] = React.useState("");

  const load = React.useCallback(() => {
    fetch("/api/org").then((r) => (r.ok ? r.json() : { org: null })).then((d) => setOrg(d.org || null)).catch(() => setOrg(null));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!legalName.trim()) { setMsg({ ok: false, text: "Enter your organization's legal name." }); return; }
    setBusy(true); setMsg(null);
    const r = await fetch("/api/org", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ legalName, taxId, country }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setMsg({ ok: false, text: d.error || "Could not create organization." }); return; }
    setOrg(d.org);
    loadEntitlements();
  };

  const invite = async () => {
    if (!inviteEmail.trim()) return;
    setBusy(true); setMsg(null);
    const r = await fetch("/api/org/members", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: inviteEmail }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setMsg({ ok: false, text: d.error || "Could not add member." }); return; }
    setOrg(d.org);
    setInviteEmail("");
    setMsg({ ok: true, text: "Invitation processed." });
  };

  const removeMember = async (userId: string) => {
    if (!confirm("Remove this member from the organization?")) return;
    const r = await fetch("/api/org/members", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setOrg(d.org);
  };
  const revokeInvite = async (email: string) => {
    const r = await fetch("/api/org/members", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setOrg(d.org);
  };

  return (
    <div style={css("padding:26px 34px 60px;max-width:760px;")}>
      <h1 style={css("margin:0 0 6px;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>Organization</h1>
      <p style={css("margin:0 0 22px;color:#57534E;font-size:14px;")}>Team accounts share every purchased bundle as seats. Add colleagues and they generate under the same entitlements.</p>

      {org === undefined ? (
        <div style={css("color:#79716B;font-size:14px;")}>Loading…</div>
      ) : org === null ? (
        <div style={css(card)}>
          <h3 style={css("margin:0 0 4px;font-size:15px;font-weight:600;")}>Create an organization</h3>
          <p style={css("margin:0 0 16px;font-size:13px;color:#79716B;line-height:1.5;")}>You&apos;ll become the owner and can invite team members.</p>
          <div style={css("margin-bottom:14px;")}>
            <label style={css(label)}>Legal name</label>
            <input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Acme, S.L." style={css(input)} />
          </div>
          <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:14px;")}>
            <div>
              <label style={css(label)}>Tax ID (NIF / CIF / VAT)</label>
              <input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="ESB12345678" style={css(input)} />
            </div>
            <div>
              <label style={css(label)}>Country (ISO)</label>
              <input value={country} onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))} placeholder="ES" style={css(input)} />
            </div>
          </div>
          {msg && <div style={css(`margin-top:14px;font-size:13px;color:${msg.ok ? "#186340" : "#8a3b3b"};`)}>{msg.text}</div>}
          <div style={css("margin-top:18px;")}>
            <button onClick={create} disabled={busy} className="hh-primary" style={css(`background:${busy ? "#7fa4d0" : "#0f4c9c"};color:#fff;border:none;border-radius:999px;padding:11px 22px;font-size:13.5px;font-weight:600;cursor:pointer;`)}>{busy ? "Creating…" : "Create organization"}</button>
          </div>
        </div>
      ) : (
        <>
          <div style={css(card)}>
            <div style={css("display:flex;justify-content:space-between;align-items:center;")}>
              <div>
                <div style={css("font-size:17px;font-weight:700;")}>{org.legalName}</div>
                <div style={css("font-size:12.5px;color:#79716B;margin-top:3px;")}>{[org.taxId, org.country].filter(Boolean).join(" · ") || "—"}</div>
              </div>
              <span style={css("font-size:11px;font-weight:600;color:#0f4c9c;background:#eaf0fb;padding:3px 10px;border-radius:999px;")}>You are {org.role}</span>
            </div>
          </div>

          <div style={css(card)}>
            <h3 style={css("margin:0 0 14px;font-size:15px;font-weight:600;")}>Members ({org.members.length})</h3>
            {org.members.map((mem) => (
              <div key={mem.id} style={css("display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #EFEEEC;")}>
                <div>
                  <div style={css("font-size:14px;font-weight:500;")}>{mem.name || mem.email}</div>
                  <div style={css("font-size:12px;color:#79716B;")}>{mem.email} · {mem.orgRole || "member"}</div>
                </div>
                {org.role === "owner" && mem.orgRole !== "owner" && (
                  <button onClick={() => removeMember(mem.id)} style={css("background:#fff;color:#8a3b3b;border:1px solid #e3c9c9;border-radius:7px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;")}>Remove</button>
                )}
              </div>
            ))}
            {org.invites.length > 0 && (
              <div style={css("margin-top:14px;")}>
                <div style={css("font-size:12px;font-weight:600;color:#79716B;text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px;")}>Pending invites</div>
                {org.invites.map((inv) => (
                  <div key={inv.email} style={css("display:flex;justify-content:space-between;align-items:center;padding:7px 0;")}>
                    <span style={css("font-size:13.5px;color:#57534E;")}>{inv.email}</span>
                    {org.role === "owner" && <button onClick={() => revokeInvite(inv.email)} style={css("background:transparent;color:#8a3b3b;border:none;font-size:12px;font-weight:600;cursor:pointer;")}>Revoke</button>}
                  </div>
                ))}
              </div>
            )}

            {org.role === "owner" && (
              <div style={css("margin-top:18px;padding-top:16px;border-top:1px solid #EFEEEC;")}>
                <label style={css(label)}>Invite a colleague by email</label>
                <div style={css("display:flex;gap:10px;flex-wrap:wrap;")}>
                  <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@company.com" style={css(input + "flex:1;min-width:220px;")} />
                  <button onClick={invite} disabled={busy} className="hh-primary" style={css(`background:${busy ? "#7fa4d0" : "#0f4c9c"};color:#fff;border:none;border-radius:999px;padding:0 22px;font-size:13.5px;font-weight:600;cursor:pointer;white-space:nowrap;`)}>Invite</button>
                </div>
                <p style={css("margin:8px 0 0;font-size:11.5px;color:#79716B;line-height:1.5;")}>If they already have an account they join immediately; otherwise they join automatically when they sign up with this email.</p>
                {msg && <div style={css(`margin-top:12px;font-size:13px;color:${msg.ok ? "#186340" : "#8a3b3b"};`)}>{msg.text}</div>}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
