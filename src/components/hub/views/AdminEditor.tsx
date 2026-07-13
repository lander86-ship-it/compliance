"use client";

import React from "react";
import { css } from "@/lib/hub/theme";

const controls = [
  { id: "1.1.1", title: "Enforce password history", active: true },
  { id: "1.1.2", title: "Maximum password age", active: false },
  { id: "1.2.1", title: "Account lockout duration", active: false },
  { id: "2.3.1.1", title: "Block Microsoft accounts", active: false },
];
const phTok = "{{password_history}}";

export function AdminEditor() {
  return (
    <div style={css("padding:26px 34px 60px;max-width:1080px;")}>
      <div style={css("font-size:12px;color:#79716B;margin-bottom:8px;font-family:'Fragment Mono',monospace;")}>CIS Windows Server 2022 / Account Policies</div>
      <h1 style={css("margin:0 0 22px;font-size:24px;font-weight:700;letter-spacing:-.3px;")}>Control editor</h1>
      <div style={css("display:grid;grid-template-columns:280px 1fr;gap:22px;align-items:start;")}>
        <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:20px;overflow:hidden;")}>
          <div style={css("padding:11px 14px;background:#F1F2EA;border-bottom:1px solid #E7E6E5;font-size:11px;font-weight:600;color:#79716B;text-transform:uppercase;letter-spacing:.4px;")}>Controls</div>
          {controls.map((c, i) => (
            <div key={c.id} style={css(`padding:11px 14px;${i < controls.length - 1 ? "border-bottom:1px solid #EFEEEC;" : ""}${c.active ? "background:#F1F2EA;border-left:3px solid #0f4c9c;" : ""}`)}>
              <div style={css(`font-family:'Fragment Mono',monospace;font-size:12px;font-weight:600;color:${c.active ? "#1C1917" : "#57534E"};`)}>{c.id}</div>
              <div style={css(`font-size:12px;color:${c.active ? "#57534E" : "#79716B"};margin-top:2px;`)}>{c.title}</div>
            </div>
          ))}
        </div>
        <div style={css("background:#FBFAF9;border:1px solid #E7E6E5;border-radius:20px;padding:22px;")}>
          <div style={css("display:flex;align-items:center;gap:10px;margin-bottom:18px;")}>
            <span style={css("font-family:'Fragment Mono',monospace;font-size:13px;font-weight:600;color:#1C1917;background:#F1F2EA;padding:3px 9px;border-radius:5px;")}>1.1.1</span>
            <input defaultValue="Enforce password history — 24 or more passwords" style={css("flex:1;border:1px solid #E7E6E5;border-radius:7px;padding:9px 12px;font-size:14px;font-weight:600;outline:none;")} />
          </div>
          <div style={css("display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:18px;")}>
            <div>
              <label style={css("font-size:11px;font-weight:600;color:#57534E;display:block;margin-bottom:5px;")}>Severity</label>
              <select style={css("width:100%;border:1px solid #E7E6E5;border-radius:7px;padding:9px;font-size:13px;")}>
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>
            <div>
              <label style={css("font-size:11px;font-weight:600;color:#57534E;display:block;margin-bottom:5px;")}>Profile</label>
              <select style={css("width:100%;border:1px solid #E7E6E5;border-radius:7px;padding:9px;font-size:13px;")}>
                <option>Level 1</option><option>Level 2</option>
              </select>
            </div>
            <div>
              <label style={css("font-size:11px;font-weight:600;color:#57534E;display:block;margin-bottom:5px;")}>Tags</label>
              <input defaultValue="password, identity" style={css("width:100%;border:1px solid #E7E6E5;border-radius:7px;padding:9px;font-size:13px;outline:none;")} />
            </div>
          </div>
          <label style={css("font-size:11px;font-weight:600;color:#57534E;display:block;margin-bottom:5px;")}>Rationale</label>
          <textarea defaultValue="Reusing old passwords weakens account security. A long history forces genuinely new passwords each cycle." style={css("width:100%;border:1px solid #E7E6E5;border-radius:7px;padding:10px 12px;font-size:13px;outline:none;height:64px;resize:none;margin-bottom:14px;")} />
          <label style={css("font-size:11px;font-weight:600;color:#57534E;display:block;margin-bottom:5px;")}>Remediation</label>
          <textarea defaultValue={`Computer Configuration → Policies → Windows Settings → Security Settings → Account Policies → Password Policy → set "Enforce password history" to ${phTok} or more.`} style={css("width:100%;border:1px solid #E7E6E5;border-radius:7px;padding:10px 12px;font-size:13px;font-family:'Fragment Mono',monospace;outline:none;height:64px;resize:none;margin-bottom:18px;")} />
          <div style={css("border:1px dashed #D8D6D3;border-radius:8px;padding:14px;background:#FBFAF9;margin-bottom:18px;")}>
            <div style={css("font-size:11px;font-weight:600;color:#57534E;text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px;")}>Customization field (ODP placeholder)</div>
            <div style={css("display:flex;gap:12px;align-items:center;font-size:12.5px;")}>
              <span style={css("font-family:'Fragment Mono',monospace;color:#0f4c9c;")}>{phTok}</span>
              <span style={css("color:#79716B;")}>type: number · default: 24 · help: &quot;Number of remembered passwords&quot;</span>
            </div>
          </div>
          <div style={css("display:flex;gap:10px;")}>
            <button style={css("background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:11px 22px;font-size:14px;font-weight:600;cursor:pointer;")}>Save control</button>
            <button style={css("background:#FBFAF9;border:1px solid #E7E6E5;color:#57534E;border-radius:999px;padding:11px 22px;font-size:14px;font-weight:600;cursor:pointer;")}>Preview in document</button>
          </div>
        </div>
      </div>
    </div>
  );
}
