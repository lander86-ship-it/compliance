"use client";

import React from "react";
import { useHub } from "@/lib/hub/store";
import { css } from "@/lib/hub/theme";

export function Auth() {
  const { s, login, signup, setAuthMode } = useHub();
  const mode = s.authMode;
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");

  const submit = () => {
    if (mode === "login") login(email.trim(), password);
    else signup(email.trim(), password, name.trim());
  };
  const input = "width:100%;border:1px solid #E7E6E5;border-radius:9px;padding:12px 14px;font-size:14px;outline:none;";
  const label = "font-size:12px;font-weight:600;color:#57534E;display:block;margin-bottom:6px;";

  return (
    <div style={css("min-height:calc(100vh - 62px);display:flex;align-items:center;justify-content:center;padding:40px 20px;")}>
      <div style={css("width:100%;max-width:420px;")}>
        <div style={css("text-align:center;margin-bottom:26px;")}>
          <div style={css("height:44px;width:44px;border-radius:11px;background:#0f4c9c;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;font-weight:700;font-size:22px;")}>H</div>
          <h2 style={css("margin:16px 0 4px;font-size:22px;font-weight:800;")}>{mode === "login" ? "Sign in to HardenHub" : "Create your account"}</h2>
          <p style={css("margin:0;color:#57534E;font-size:13.5px;")}>{mode === "login" ? "Access your guides and library." : "Buy access, then generate guides on demand in your template."}</p>
        </div>

        <div style={css("border:1px solid #E7E6E5;border-radius:16px;padding:24px;background:#FBFAF9;")}>
          <div style={css("display:flex;flex-direction:column;gap:14px;")}>
            {mode === "signup" && (
              <div>
                <label style={css(label)}>Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} style={css(input)} placeholder="Ada Lovelace" />
              </div>
            )}
            <div>
              <label style={css(label)}>Work email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} style={css(input)} placeholder="you@company.com" />
            </div>
            <div>
              <label style={css(label)}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} style={css(input)} placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"} />
            </div>

            {s.authError && <div style={css("font-size:12.5px;color:#b4381f;background:#fbf3ec;border:1px solid #e6c9b8;border-radius:8px;padding:9px 12px;")}>{s.authError}</div>}

            <button onClick={submit} disabled={s.authBusy} className="hh-primary" style={css(`background:${s.authBusy ? "#7ea3cc" : "#0f4c9c"};color:#fff;border:none;border-radius:999px;padding:13px;font-size:15px;font-weight:600;cursor:${s.authBusy ? "default" : "pointer"};margin-top:4px;`)}>
              {s.authBusy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </div>
        </div>

        <div style={css("text-align:center;margin-top:16px;font-size:13px;color:#57534E;")}>
          {mode === "login" ? (
            <>New to HardenHub? <button onClick={() => setAuthMode("signup")} style={css("background:none;border:none;color:#0f4c9c;font-weight:600;cursor:pointer;font-size:13px;")}>Create an account</button></>
          ) : (
            <>Already have an account? <button onClick={() => setAuthMode("login")} style={css("background:none;border:none;color:#0f4c9c;font-weight:600;cursor:pointer;font-size:13px;")}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  );
}
