"use client";

import React from "react";
import { useHub } from "@/lib/hub/store";
import { css, sevStyle } from "@/lib/hub/theme";

const WIZ_DISPLAY_CAP = 80; // render at most N control rows for performance; the rest stay included

const STEP_NAMES = ["Organization", "Branding", "Technical scope", "Controls", "Parameters", "Review & generate"];
const COLORS = ["#0f4c9c", "#6a2f6a", "#1f6a4d", "#b4381f", "#1C1917"];
const ODP_ROWS = [
  { k: "pwlen", label: "Minimum password length", sub: "control 1.1.4 · default 14" },
  { k: "lockout", label: "Account lockout threshold", sub: "control 1.2.2 · default 5 attempts" },
  { k: "logret", label: "Log retention (days)", sub: "control 17.x · default 365" },
  { k: "sessions", label: "Session inactivity lock (min)", sub: "control 2.3.7.1 · default 15" },
];

function StepRail() {
  const { s, set } = useHub();
  const step = s.wizardStep;
  return (
    <div style={css("width:250px;background:#F1F2EA;border-right:1px solid #E7E6E5;padding:24px 20px;flex-shrink:0;")}>
      <div style={css("font-size:11px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:#79716B;margin-bottom:4px;")}>Scope Wizard</div>
      <div style={css("font-size:14px;font-weight:600;margin-bottom:20px;line-height:1.3;")}>{s.wizName}</div>
      {STEP_NAMES.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={label} onClick={() => set({ wizardStep: n })} style={css(`display:flex;align-items:center;gap:9px;padding:10px 4px;font-size:13px;font-weight:${active ? 600 : 500};color:${active ? "#1C1917" : done ? "#1f7a4d" : "#79716B"};cursor:pointer;`)}>
            <span style={css(`width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;font-family:'Fragment Mono',monospace;flex-shrink:0;background:${active ? "#0f4c9c" : done ? "#1f7a4d" : "#E7E6E5"};color:${n <= step ? "#fff" : "#79716B"};`)}>{done ? "✓" : String(n)}</span>
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

const inputStyle = "width:100%;border:1px solid #E7E6E5;border-radius:8px;padding:11px 13px;font-size:14px;outline:none;";
const labelStyle = "font-size:12px;font-weight:600;color:#57534E;display:block;margin-bottom:6px;";

function Step1() {
  const { s, setScope } = useHub();
  const fields: [keyof typeof s.scope, string, boolean][] = [
    ["legal", "Legal name", true],
    ["trade", "Trade name", false],
    ["sector", "Sector", false],
    ["owner", "Document owner", false],
    ["docv", "Document version", false],
    ["classification", "Classification", false],
  ];
  return (
    <>
      <h2 style={css("margin:0 0 4px;font-size:22px;font-weight:700;")}>Organization details</h2>
      <p style={css("margin:0 0 26px;color:#57534E;font-size:14px;")}>These fields populate the cover page, headers, and version-control block of every generated document.</p>
      <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:16px;")}>
        {fields.map(([k, label, full]) => (
          <div key={k} style={full ? css("grid-column:1/3;") : undefined}>
            <label style={css(labelStyle)}>{label}</label>
            <input value={s.scope[k]} onChange={(e) => setScope(k, e.target.value)} style={css(inputStyle + (k === "docv" ? "font-family:'Fragment Mono',monospace;" : ""))} />
          </div>
        ))}
      </div>
    </>
  );
}

export function TemplateUpload() {
  const { s, setTemplate } = useHub();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  const onFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    const lower = file.name.toLowerCase();
    const type: "docx" | "pdf" | null = lower.endsWith(".docx") ? "docx" : lower.endsWith(".pdf") ? "pdf" : null;
    if (!type) { setError("Unsupported file. Upload a .docx (preferred) or .pdf template."); return; }
    if (file.size > 15 * 1024 * 1024) { setError("File too large (max 15 MB)."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.slice(result.indexOf(",") + 1) : result;
      setTemplate({ base64, type, name: file.name });
    };
    reader.onerror = () => setError("Could not read the file. Try again.");
    reader.readAsDataURL(file);
  };

  const tpl = s.template;
  return (
    <div style={css("margin-top:26px;border:1px solid #E7E6E5;border-radius:16px;padding:20px;background:#FBFAF9;")}>
      <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;")}>
        <div style={css("font-size:13.5px;font-weight:700;")}>House-style template <span style={css("font-weight:500;color:#79716B;")}>· optional</span></div>
        <span style={css("font-size:11px;font-family:'Fragment Mono',monospace;background:#eef4fb;color:#0f4c9c;padding:3px 9px;border-radius:6px;")}>AI delivers in your format</span>
      </div>
      <p style={css("margin:0 0 14px;color:#57534E;font-size:12.5px;line-height:1.5;")}>
        Upload your own <strong>.docx</strong> (preferred) or <strong>.pdf</strong> template and the AI-generated
        standard is rendered inside it — your cover, headers/footers, fonts and branding are preserved. In a DOCX,
        place a <code style={css("font-family:'Fragment Mono',monospace;background:#F1F2EA;padding:1px 5px;border-radius:4px;")}>{"{{POLICY_BODY}}"}</code> marker
        where the standard should flow; optional inline fields: <code style={css("font-family:'Fragment Mono',monospace;background:#F1F2EA;padding:1px 5px;border-radius:4px;")}>{"{{ORG}} {{TITLE}} {{VERSION}} {{DATE}} {{CLASSIFICATION}} {{AUTHOR}} {{BENCHMARK}}"}</code>.
      </p>
      <input ref={inputRef} type="file" accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf" onChange={(e) => onFile(e.target.files?.[0])} style={css("display:none;")} />
      {!tpl ? (
        <div onClick={() => inputRef.current?.click()} style={css("border:2px dashed #D8D6D3;border-radius:12px;padding:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:repeating-linear-gradient(45deg,#f7f9fc,#f7f9fc 10px,#f2f5f9 10px,#f2f5f9 20px);color:#79716B;cursor:pointer;")}>
          <div style={css("font-size:22px;margin-bottom:4px;")}>↑</div>
          <div style={css("font-size:13px;font-weight:600;color:#57534E;")}>Drop template or click to upload</div>
          <div style={css("font-size:11px;font-family:'Fragment Mono',monospace;margin-top:4px;")}>DOCX · PDF · max 15 MB</div>
        </div>
      ) : (
        <div style={css("display:flex;align-items:center;gap:12px;border:1px solid #cfe0d6;background:#f0f7f3;border-radius:10px;padding:12px 14px;")}>
          <span style={css("font-size:11px;font-family:'Fragment Mono',monospace;background:#0f4c9c;color:#fff;padding:4px 8px;border-radius:6px;text-transform:uppercase;")}>{tpl.type}</span>
          <div style={css("flex:1;min-width:0;")}>
            <div style={css("font-size:13px;font-weight:600;color:#186340;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;")}>{tpl.name}</div>
            <div style={css("font-size:11.5px;color:#57534E;")}>Policy standard will be delivered inside this template.</div>
          </div>
          <button onClick={() => { setTemplate(null); if (inputRef.current) inputRef.current.value = ""; }} style={css("background:#fff;border:1px solid #E7E6E5;color:#b4381f;border-radius:7px;padding:7px 12px;font-size:12px;font-weight:600;cursor:pointer;flex-shrink:0;")}>Remove</button>
        </div>
      )}
      {error && <div style={css("margin-top:10px;font-size:12px;color:#b4381f;")}>{error}</div>}
    </div>
  );
}

function Step2() {
  const { s, setScope } = useHub();
  return (
    <>
      <h2 style={css("margin:0 0 4px;font-size:22px;font-weight:700;")}>Branding</h2>
      <p style={css("margin:0 0 26px;color:#57534E;font-size:14px;")}>Applied to the cover page, headers, and footer of the deliverable.</p>
      <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:24px;")}>
        <div>
          <label style={css("font-size:12px;font-weight:600;color:#57534E;display:block;margin-bottom:8px;")}>Organization logo</label>
          <div style={css("border:2px dashed #D8D6D3;border-radius:16px;height:150px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:repeating-linear-gradient(45deg,#f7f9fc,#f7f9fc 10px,#f2f5f9 10px,#f2f5f9 20px);color:#79716B;cursor:pointer;")}>
            <div style={css("font-size:26px;margin-bottom:6px;")}>↑</div>
            <div style={css("font-size:13px;font-weight:600;color:#57534E;")}>Drop logo or click to upload</div>
            <div style={css("font-size:11px;font-family:'Fragment Mono',monospace;margin-top:4px;")}>PNG · SVG · max 2 MB</div>
          </div>
        </div>
        <div>
          <label style={css("font-size:12px;font-weight:600;color:#57534E;display:block;margin-bottom:8px;")}>Corporate color</label>
          <div style={css("display:flex;gap:10px;margin-bottom:22px;")}>
            {COLORS.map((c) => (
              <button key={c} onClick={() => setScope("color", c)} style={css(`width:30px;height:30px;border-radius:7px;background:${c};cursor:pointer;border:2px solid ${s.scope.color === c ? "#1C1917" : "transparent"};`)} />
            ))}
          </div>
          <label style={css("font-size:12px;font-weight:600;color:#57534E;display:block;margin-bottom:8px;")}>Confidentiality notice (footer)</label>
          <textarea value={s.scope.confidentiality} onChange={(e) => setScope("confidentiality", e.target.value)} style={css("width:100%;border:1px solid #E7E6E5;border-radius:8px;padding:11px 13px;font-size:13px;outline:none;height:82px;resize:none;")} />
        </div>
      </div>
      <div style={css("margin-top:26px;border:1px solid #E7E6E5;border-radius:16px;padding:20px;background:#FBFAF9;")}>
        <div style={css("font-size:11px;color:#79716B;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;")}>Cover preview</div>
        <div style={css("border:1px solid #EFEEEC;border-radius:8px;padding:26px;background:#FBFAF9;")}>
          <div style={css(`width:52px;height:52px;border-radius:8px;background:${s.scope.color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-family:'Fragment Mono',monospace;`)}>N</div>
          <div style={css(`font-family:'DM Sans',serif;font-size:22px;font-weight:600;margin-top:18px;color:${s.scope.color};`)}>Windows Server 2022 Hardening Standard</div>
          <div style={css("font-size:13px;color:#57534E;margin-top:6px;")}>{s.scope.legal} · {s.scope.classification} · v{s.scope.docv}</div>
        </div>
      </div>
      <TemplateUpload />
    </>
  );
}

function Step3() {
  const { s, setScope } = useHub();
  const roles = [
    { label: "Domain controller", checked: true, faint: false },
    { label: "Member server", checked: true, faint: false },
    { label: "Standalone / workgroup server", checked: false, faint: true },
  ];
  const seg = (opts: string[], value: string, key: "profile" | "env", maxW: string) => (
    <div style={css(`display:flex;gap:10px;max-width:${maxW};margin-bottom:24px;`)}>
      {opts.map((l) => {
        const on = value === l;
        return (
          <button key={l} onClick={() => setScope(key, l)} style={css(`flex:1;background:${on ? "#0f4c9c" : "#fff"};color:${on ? "#fff" : "#57534E"};border:1px solid ${on ? "#0f4c9c" : "#E7E6E5"};border-radius:8px;padding:11px;font-size:13px;font-weight:600;cursor:pointer;`)}>{l}</button>
        );
      })}
    </div>
  );
  return (
    <>
      <h2 style={css("margin:0 0 4px;font-size:22px;font-weight:700;")}>Technical scope</h2>
      <p style={css("margin:0 0 26px;color:#57534E;font-size:14px;")}>Determines which controls are applicable to your environment.</p>
      <label style={css(labelStyle)}>Benchmark profile</label>
      {seg(["Level 1", "Level 2"], s.scope.profile, "profile", "320px")}
      <label style={css(labelStyle)}>Environment</label>
      {seg(["On-premises", "Cloud", "Hybrid"], s.scope.env, "env", "440px")}
      <label style={css(labelStyle)}>Platform roles</label>
      <div style={css("display:flex;flex-direction:column;gap:10px;max-width:520px;")}>
        {roles.map((r) => (
          <label key={r.label} style={css(`display:flex;align-items:center;gap:10px;border:1px solid #E7E6E5;border-radius:8px;padding:12px 14px;background:#FBFAF9;font-size:13.5px;cursor:pointer;${r.faint ? "color:#79716B;" : ""}`)}>
            <input type="checkbox" defaultChecked={r.checked} style={css("width:16px;height:16px;accent-color:#0f4c9c;")} /> {r.label}
          </label>
        ))}
      </div>
    </>
  );
}

function Step4() {
  const { s, toggleExclude, setReason } = useHub();
  const total = s.wizTotal || s.wizControls.length;
  const excluded = Object.keys(s.excluded).length;
  const included = total - excluded;
  const shown = s.wizControls.slice(0, WIZ_DISPLAY_CAP);
  return (
    <>
      <h2 style={css("margin:0 0 4px;font-size:22px;font-weight:700;")}>Include / exclude controls</h2>
      <p style={css("margin:0 0 18px;color:#57534E;font-size:14px;")}>Toggle off any control that does not apply. Excluded controls require a justification and are recorded in the applicability matrix.</p>
      <div style={css("display:flex;gap:20px;margin-bottom:16px;font-size:13px;font-family:'Fragment Mono',monospace;")}>
        <span style={css("color:#1f7a4d;font-weight:600;")}>● {included} included</span>
        <span style={css("color:#b5721c;font-weight:600;")}>● {excluded} excluded</span>
        <span style={css("color:#79716B;")}>of {total} total</span>
      </div>
      {s.wizLoading && <div style={css("color:#79716B;font-size:13px;padding:20px;")}>Loading controls…</div>}
      <div style={css("border:1px solid #E7E6E5;border-radius:16px;overflow:hidden;background:#FBFAF9;")}>
        {shown.map((c) => {
          const isEx = !!s.excluded[c.id];
          return (
            <div key={c.id} style={css(`display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #EFEEEC;background:${isEx ? "#fbf7f4" : "#fff"};`)}>
              <button onClick={() => toggleExclude(c.id)} style={css(`width:42px;height:24px;border-radius:20px;position:relative;cursor:pointer;flex-shrink:0;border:none;background:${isEx ? "#E7E6E5" : "#1f7a4d"};`)}>
                <span style={css(`position:absolute;top:2px;left:${isEx ? "2px" : "20px"};width:20px;height:20px;border-radius:50%;background:#FBFAF9;transition:left .15s;`)} />
              </button>
              <span style={css("font-family:'Fragment Mono',monospace;font-size:12px;font-weight:600;color:#1C1917;width:110px;flex-shrink:0;")}>{c.id}</span>
              <div style={css("flex:1;min-width:0;")}>
                <div style={css(`font-size:13.5px;font-weight:500;${isEx ? "text-decoration:line-through;color:#79716B;" : ""}`)}>{c.title}</div>
                <div style={css("font-size:11px;color:#79716B;margin-top:2px;")}>{c.family}</div>
                {isEx && (
                  <input value={s.excluded[c.id]} onChange={(e) => setReason(c.id, e.target.value)} placeholder="Justification (N/A, risk accepted, compensating control)" style={css("margin-top:8px;width:100%;border:1px solid #e6c9b8;border-radius:6px;padding:7px 10px;font-size:12px;outline:none;background:#FBFAF9;")} />
                )}
              </div>
              <span style={css(sevStyle(c.severity))}>{c.severity}</span>
            </div>
          );
        })}
      </div>
      {total > shown.length && (
        <div style={css("font-size:12px;color:#79716B;margin-top:12px;")}>Showing the first {shown.length} of {total} controls. The remaining {total - shown.length} are included by default — refine or exclude them after generating.</div>
      )}
    </>
  );
}

function Step5() {
  const { s, setOdp } = useHub();
  return (
    <>
      <h2 style={css("margin:0 0 4px;font-size:22px;font-weight:700;")}>Organization-defined parameters</h2>
      <p style={css("margin:0 0 26px;color:#57534E;font-size:14px;")}>Control-level values with suggested defaults. These substitute into the remediation text of each control.</p>
      <div style={css("display:flex;flex-direction:column;gap:14px;max-width:640px;")}>
        {ODP_ROWS.map((r) => (
          <div key={r.k} style={css("display:flex;align-items:center;gap:16px;border:1px solid #E7E6E5;border-radius:9px;padding:14px 16px;background:#FBFAF9;")}>
            <div style={css("flex:1;")}>
              <div style={css("font-size:13.5px;font-weight:600;")}>{r.label}</div>
              <div style={css("font-size:11.5px;color:#79716B;font-family:'Fragment Mono',monospace;")}>{r.sub}</div>
            </div>
            <input value={s.odp[r.k]} onChange={(e) => setOdp(r.k, e.target.value)} style={css("width:90px;border:1px solid #E7E6E5;border-radius:7px;padding:9px;font-size:14px;font-family:'Fragment Mono',monospace;text-align:center;outline:none;")} />
          </div>
        ))}
      </div>
    </>
  );
}

export function PolicyPreview() {
  const { s } = useHub();
  const brand = s.scope.color;
  return (
    <div style={css("border:1px solid #E7E6E5;border-radius:16px;background:#fff;max-width:760px;margin-bottom:26px;overflow:hidden;")}>
      <div style={css("display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:1px solid #EFEEEC;background:#FBFAF9;")}>
        <div style={css("font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#57534E;")}>Standard preview</div>
        <div style={css("display:flex;gap:8px;align-items:center;")}>
          {s.template && <span style={css("font-size:11px;font-family:'Fragment Mono',monospace;background:#eef4fb;color:#0f4c9c;padding:3px 9px;border-radius:6px;")}>in {s.template.type.toUpperCase()} template</span>}
          <span style={css(`font-size:11px;font-family:'Fragment Mono',monospace;padding:3px 9px;border-radius:6px;${s.previewAi ? "background:#eaf6ef;color:#186340;" : "background:#F1F2EA;color:#79716B;"}`)}>{s.previewAi ? "AI narrative" : "static narrative"}</span>
        </div>
      </div>
      <div style={css("padding:30px 34px;max-height:520px;overflow-y:auto;")}>
        <div style={css(`font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:${brand};font-weight:700;`)}>{s.scope.legal}</div>
        <div style={css(`font-size:26px;font-weight:700;color:${brand};margin:6px 0 4px;font-family:'DM Sans',serif;`)}>{((s.selectedGuide?.name || s.wizName || "Security").replace(/ — Security Baseline$/, "").replace(/ Security Technical Implementation Guide.*$/, ""))} Hardening Standard</div>
        <div style={css("font-size:12.5px;color:#79716B;margin-bottom:22px;")}>{s.scope.classification} · v{s.scope.docv} · {s.scope.owner}</div>
        {s.previewBlocks.map((bl, i) => {
          switch (bl.t) {
            case "h1": return <div key={i} style={css(`font-size:18px;font-weight:700;color:${brand};margin:24px 0 8px;padding-bottom:6px;border-bottom:2px solid ${brand};`)}>{bl.text}</div>;
            case "h2": return <div key={i} style={css("font-size:15px;font-weight:700;color:#1C1917;margin:18px 0 6px;")}>{bl.text}</div>;
            case "h3": return <div key={i} style={css(`font-size:13.5px;font-weight:700;color:${brand};margin:14px 0 4px;font-family:'Fragment Mono',monospace;`)}>{bl.text}</div>;
            case "p": return <p key={i} style={css("font-size:13px;line-height:1.6;color:#44403C;margin:0 0 10px;")}>{bl.text}</p>;
            case "li": return <div key={i} style={css("font-size:13px;line-height:1.55;color:#44403C;margin:0 0 5px;padding-left:18px;position:relative;")}><span style={css(`position:absolute;left:2px;color:${brand};`)}>•</span>{bl.text}</div>;
            case "kv": return <div key={i} style={css("font-size:12.5px;line-height:1.55;color:#57534E;margin:0 0 5px;")}><strong style={css("color:#1C1917;")}>{bl.label}.</strong> {bl.text}</div>;
            case "role": return (
              <div key={i} style={css("margin:0 0 12px;")}>
                <div style={css("font-size:13px;font-weight:700;color:#1C1917;margin-bottom:4px;")}>{bl.role}</div>
                {bl.resp.map((r, j) => <div key={j} style={css("font-size:12.5px;line-height:1.5;color:#44403C;margin:0 0 3px;padding-left:18px;position:relative;")}><span style={css(`position:absolute;left:2px;color:${brand};`)}>•</span>{r}</div>)}
              </div>
            );
            default: return null;
          }
        })}
      </div>
    </div>
  );
}

function Step6() {
  const { s, generate, go, previewStandard } = useHub();
  const total = s.wizTotal || s.wizControls.length;
  const excluded = Object.keys(s.excluded).length;
  const included = total - excluded;
  return (
    <>
      <h2 style={css("margin:0 0 4px;font-size:22px;font-weight:700;")}>Review &amp; generate</h2>
      <p style={css("margin:0 0 24px;color:#57534E;font-size:14px;")}>Confirm the configuration. Generation runs asynchronously — you&apos;ll be emailed when the artifact is ready.</p>
      <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:24px;")}>
        <div style={css("border:1px solid #E7E6E5;border-radius:9px;padding:16px;background:#FBFAF9;")}>
          <div style={css("font-size:11px;color:#79716B;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;")}>Organization</div>
          <div style={css("font-size:14px;font-weight:600;")}>{s.scope.legal}</div>
          <div style={css("font-size:12.5px;color:#57534E;margin-top:2px;")}>{s.scope.classification} · v{s.scope.docv} · {s.scope.owner}</div>
        </div>
        <div style={css("border:1px solid #E7E6E5;border-radius:9px;padding:16px;background:#FBFAF9;")}>
          <div style={css("font-size:11px;color:#79716B;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;")}>Scope</div>
          <div style={css("font-size:14px;font-weight:600;")}>{s.scope.profile} · {s.scope.env}</div>
          <div style={css("font-size:12.5px;color:#57534E;margin-top:2px;")}>{included} controls included · {excluded} excluded</div>
        </div>
      </div>
      <div style={css("border:1px solid #E7E6E5;border-radius:9px;padding:16px;background:#FBFAF9;margin-bottom:26px;")}>
        <div style={css("font-size:11px;color:#79716B;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;")}>Output formats</div>
        <div style={css("display:flex;gap:10px;align-items:center;flex-wrap:wrap;")}>
          {["DOCX", "PDF", "XLSX", "POLICY"].map((f) => (
            <span key={f} style={css("font-size:12px;font-family:'Fragment Mono',monospace;background:#F1F2EA;color:#0f4c9c;padding:5px 12px;border-radius:6px;font-weight:600;")}>{f === "POLICY" ? "POLICY (AI)" : f}</span>
          ))}
          <span style={css("font-size:12px;color:#57534E;padding:5px 0;")}>watermark + license ID · editable policy standard{s.template ? ` · POLICY in your ${s.template.type.toUpperCase()} template` : ""}</span>
        </div>
      </div>

      {/* Live preview of the AI policy standard */}
      <div style={css("margin-bottom:22px;")}>
        {s.previewStatus === "idle" && (
          <button onClick={() => previewStandard()} style={css("background:#fff;color:#0f4c9c;border:1px solid #0f4c9c;border-radius:999px;padding:11px 22px;font-size:14px;font-weight:600;cursor:pointer;")}>Preview standard</button>
        )}
        {s.previewStatus === "loading" && (
          <div style={css("display:flex;align-items:center;gap:12px;font-size:13px;color:#57534E;")}>
            <div style={css("width:18px;height:18px;border:3px solid #dfe6ef;border-top-color:#0f4c9c;border-radius:50%;animation:hh-spin .8s linear infinite;")} />
            Drafting the standard{s.template ? " in your template" : ""}…
          </div>
        )}
        {s.previewStatus === "failed" && (
          <div style={css("border:1px solid #e6c9b8;background:#fbf3ec;border-radius:12px;padding:14px 16px;max-width:520px;")}>
            <div style={css("font-size:13px;font-weight:600;color:#b4381f;margin-bottom:8px;")}>Preview failed — {s.previewError}</div>
            <button onClick={() => previewStandard()} style={css("background:#0f4c9c;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;")}>Retry</button>
          </div>
        )}
        {s.previewStatus === "done" && (
          <>
            <PolicyPreview />
            <button onClick={() => previewStandard()} style={css("background:#fff;color:#57534E;border:1px solid #E7E6E5;border-radius:8px;padding:8px 16px;font-size:12.5px;font-weight:600;cursor:pointer;margin-bottom:6px;")}>↻ Refresh preview</button>
          </>
        )}
      </div>

      {s.genStatus === "idle" && (
        <button onClick={() => generate()} style={css("background:#1f7a4d;color:#fff;border:none;border-radius:999px;padding:14px 28px;font-size:15px;font-weight:600;cursor:pointer;")}>Generate documents</button>
      )}
      {s.genStatus === "processing" && (
        <div style={css("display:flex;align-items:center;gap:14px;border:1px solid #cfe0d6;background:#f0f7f3;border-radius:16px;padding:18px 20px;max-width:520px;")}>
          <div style={css("width:22px;height:22px;border:3px solid #cfe0d6;border-top-color:#1f7a4d;border-radius:50%;animation:hh-spin .8s linear infinite;")} />
          <div>
            <div style={css("font-size:14px;font-weight:600;color:#186340;")}>Generating — job queued</div>
            <div style={css("font-size:12.5px;color:#57534E;")}>Resolving applicability · substituting fields · rendering DOCX/PDF/XLSX…</div>
          </div>
        </div>
      )}
      {s.genStatus === "failed" && (
        <div style={css("border:1px solid #e6c9b8;background:#fbf3ec;border-radius:16px;padding:18px 20px;max-width:520px;")}>
          <div style={css("font-size:14px;font-weight:600;color:#b4381f;margin-bottom:4px;")}>Generation failed</div>
          <div style={css("font-size:12.5px;color:#57534E;margin-bottom:12px;")}>{s.genError}</div>
          <button onClick={() => generate()} style={css("background:#0f4c9c;color:#fff;border:none;border-radius:8px;padding:10px 18px;font-size:13px;font-weight:600;cursor:pointer;")}>Retry</button>
        </div>
      )}
      {s.genStatus === "done" && (
        <div style={css("border:1px solid #cfe0d6;background:#f0f7f3;border-radius:16px;padding:20px;max-width:560px;")}>
          <div style={css("font-size:15px;font-weight:600;color:#186340;margin-bottom:4px;")}>✓ Documents ready</div>
          <div style={css("font-size:13px;color:#57534E;margin-bottom:16px;")}>{s.genArtifacts.length} artifacts generated · hash verified · saved to your library.</div>
          <div style={css("display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;")}>
            {s.genArtifacts.map((a) => (
              <a key={a.format} href={a.url} style={css("font-size:12px;font-family:'Fragment Mono',monospace;background:#F1F2EA;color:#0f4c9c;padding:6px 12px;border-radius:6px;font-weight:600;text-decoration:none;")}>↓ {a.format}</a>
            ))}
          </div>
          <button onClick={() => go("library")} style={css("background:#0f4c9c;color:#fff;border:none;border-radius:8px;padding:12px 22px;font-size:14px;font-weight:600;cursor:pointer;")}>Go to library →</button>
        </div>
      )}
    </>
  );
}

export function Wizard() {
  const { s, set } = useHub();
  const step = s.wizardStep;
  const StepComp = [Step1, Step2, Step3, Step4, Step5, Step6][step - 1];
  return (
    <div style={css("display:flex;min-height:calc(100vh - 62px);")}>
      <StepRail />
      <div style={css("flex:1;min-width:0;display:flex;flex-direction:column;")}>
        <div style={css("flex:1;overflow-y:auto;padding:30px 40px;max-width:900px;")}>
          <StepComp />
        </div>
        <div style={css("border-top:1px solid #E7E6E5;background:#FBFAF9;padding:14px 40px;display:flex;justify-content:space-between;align-items:center;")}>
          <button onClick={() => set((p) => ({ wizardStep: Math.max(1, p.wizardStep - 1) }))} style={css("background:#FBFAF9;border:1px solid #E7E6E5;color:#57534E;border-radius:999px;padding:11px 22px;font-size:14px;font-weight:600;cursor:pointer;")}>Back</button>
          <div style={css("font-size:12px;color:#79716B;font-family:'Fragment Mono',monospace;")}>Step {step} of 6</div>
          {step !== 6 ? (
            <button onClick={() => set((p) => ({ wizardStep: Math.min(6, p.wizardStep + 1) }))} className="hh-primary" style={css("background:#0f4c9c;color:#fff;border:none;border-radius:999px;padding:11px 26px;font-size:14px;font-weight:600;cursor:pointer;")}>Continue</button>
          ) : (
            <div style={css("width:96px;")} />
          )}
        </div>
      </div>
    </div>
  );
}
