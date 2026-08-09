"use client";

import React, { useEffect, useState } from "react";
import { useHub } from "@/lib/hub/store";
import { css } from "@/lib/hub/theme";

const ROLE_LABEL: Record<string, string> = { owner: "Owner (admin)", admin: "Administrator", author: "Author", customer: "Customer" };

export function Account() {
  const { s, go, logout, loadPurchases, updateAccount } = useHub();
  const u = s.user;

  const [name, setName] = useState(u?.name || "");
  const [email, setEmail] = useState(u?.email || "");
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (s.purchasesStatus === "idle") loadPurchases();
  }, [s.purchasesStatus, loadPurchases]);
  useEffect(() => {
    setName(u?.name || "");
    setEmail(u?.email || "");
  }, [u?.name, u?.email]);

  const subs = new Set<string>();
  for (const p of s.purchases || []) for (const b of p.bundles) subs.add(b.id);

  const input = "width:100%;padding:11px 13px;border:1px solid #E7E6E5;border-radius:10px;font-size:14px;background:#fff;outline:none;box-sizing:border-box;";
  const label = "font-size:12px;font-weight:600;color:#57534E;margin-bottom:6px;display:block;";

  const save = async () => {
    setBusy(true); setMsg(null);
    const patch: { name?: string; email?: string; currentPassword?: string; newPassword?: string } = {};
    if (name !== (u?.name || "")) patch.name = name;
    if (email !== (u?.email || "")) patch.email = email;
    if (newPw) patch.newPassword = newPw;
    if (patch.email || patch.newPassword) patch.currentPassword = curPw;
    if (Object.keys(patch).length === 0) { setBusy(false); setMsg({ ok: false, text: "No changes to save." }); return; }
    const r = await updateAccount(patch);
    setBusy(false);
    setMsg(r.ok ? { ok: true, text: "Profile updated." } : { ok: false, text: r.error || "Update failed." });
    if (r.ok) { setCurPw(""); setNewPw(""); }
  };

  return (
    <div style={css("padding:26px 34px 60px;max-width:720px;")}>
      <h1 style={css("margin:0 0 6px;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>Account</h1>
      <p style={css("margin:0 0 22px;color:#57534E;font-size:14px;")}>Manage your profile, credentials and plan.</p>

      <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:20px;padding:22px;margin-bottom:20px;")}>
        <h3 style={css("margin:0 0 16px;font-size:15px;font-weight:600;")}>Profile</h3>
        <div style={css("margin-bottom:14px;")}>
          <label style={css(label)}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={css(input)} />
        </div>
        <div style={css("margin-bottom:14px;")}>
          <label style={css(label)}>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={css(input)} />
        </div>
        <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:14px;")}>
          <div>
            <label style={css(label)}>New password</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Leave blank to keep" style={css(input)} />
          </div>
          <div>
            <label style={css(label)}>Current password</label>
            <input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} placeholder="Required to change email/password" style={css(input)} />
          </div>
        </div>
        {msg && <div style={css(`margin-top:14px;font-size:13px;color:${msg.ok ? "#186340" : "#8a3b3b"};`)}>{msg.text}</div>}
        <div style={css("margin-top:18px;display:flex;gap:10px;")}>
          <button onClick={save} disabled={busy} className="hh-primary" style={css(`background:${busy ? "#7fa4d0" : "#0f4c9c"};color:#fff;border:none;border-radius:999px;padding:11px 22px;font-size:13.5px;font-weight:600;cursor:pointer;`)}>{busy ? "Saving…" : "Save changes"}</button>
        </div>
      </div>

      <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:20px;padding:22px;margin-bottom:20px;")}>
        <h3 style={css("margin:0 0 14px;font-size:15px;font-weight:600;")}>Plan</h3>
        <div style={css("display:flex;justify-content:space-between;font-size:14px;padding:6px 0;")}><span style={css("color:#79716B;")}>Role</span><span style={css("font-weight:600;")}>{ROLE_LABEL[u?.role || ""] || u?.role || "—"}</span></div>
        <div style={css("display:flex;justify-content:space-between;font-size:14px;padding:6px 0;")}><span style={css("color:#79716B;")}>Active subscriptions</span><span style={css("font-weight:600;")}>{s.entAdmin ? "All (admin)" : subs.size}</span></div>
        <div style={css("display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;")}>
          <button onClick={() => go("subscriptions")} style={css("background:#fff;color:#0f4c9c;border:1px solid #c3d2ea;border-radius:999px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;")}>Subscriptions</button>
          <button onClick={() => go("invoices")} style={css("background:#fff;color:#0f4c9c;border:1px solid #c3d2ea;border-radius:999px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;")}>Invoices</button>
        </div>
      </div>

      <button onClick={() => logout()} style={css("background:#fff;color:#8a3b3b;border:1px solid #e3c9c9;border-radius:999px;padding:11px 20px;font-size:13.5px;font-weight:600;cursor:pointer;")}>Sign out</button>
    </div>
  );
}
