// Policy narrative drafting — ported (concept + fallback text) from the /cis service's
// app/llm.py, adapted to SecureHub: generic/neutral org (no client branding), TypeScript,
// and an Anthropic Messages API call with a guaranteed static fallback.
//
// The AI only drafts the surrounding narrative (Purpose / Scope / Roles / Compliance).
// The technical controls stay VERBATIM from the source benchmark elsewhere in the document.

export type Role = { role: string; responsibilities: string[] };
export type Narrative = {
  purposeIntro: string;
  purposePoints: string[];
  purposeAims: string[];
  scopeIntro: string;
  scopeAppliesTo: string[];
  scopeCovers: string[];
  roles: Role[];
  complianceIntro: string;
  complianceExceptionFields: string[];
  complianceEnforcement: string;
};

export type PolicyInput = {
  org: string; // customer legal name (from the Scope Wizard)
  platform: string;
  benchTitle: string;
  benchVersion: string;
  controlCount: number;
  sectionTitles: string[];
};

// ── Static fallback (used when no ANTHROPIC_API_KEY, or on any AI failure) ──
export function staticNarrative(p: PolicyInput): Narrative {
  const plat = p.platform || "the in-scope technology";
  const ver = p.benchVersion ? ` (version ${p.benchVersion})` : "";
  return {
    purposeIntro:
      `The purpose of this standard is to establish the mandatory security configuration and ` +
      `hardening requirements for ${plat}, based on the ${p.benchTitle}${ver}. It translates the ` +
      `referenced benchmark into enforceable internal requirements so that systems are configured, ` +
      `operated and maintained to a consistent, defensible security baseline.`,
    purposePoints: [
      "Configured in line with recognised industry hardening guidance",
      "Protected against common misconfigurations and known attack vectors",
      "Consistently secured across regions, functions and business units",
      "Auditable against a defined and measurable set of controls",
    ],
    purposeAims: [
      "Reduce the attack surface of information systems and digital assets",
      "Support regulatory, contractual and internal compliance obligations",
      "Provide a clear basis for configuration reviews and technical audits",
      "Enable risk-based exceptions where a control cannot be fully applied",
    ],
    scopeIntro:
      `This standard applies to all ${plat} systems owned, operated or managed by ${p.org}, or by ` +
      `third parties on ${p.org}'s behalf, that store, process or transmit ${p.org} information. It ` +
      `applies regardless of environment (production, non-production) or hosting model (on-premises, ` +
      `cloud or hybrid).`,
    scopeAppliesTo: [
      `All ${p.org} employees who administer or operate in-scope systems`,
      "Contractors, third-party vendors and managed service providers",
      "Affiliates and subsidiaries operating in-scope systems",
      `Any party responsible for the configuration of ${p.org} IT/OT assets`,
    ],
    scopeCovers: [
      `Secure configuration and hardening of ${plat}`,
      "The specific technical controls derived from the referenced benchmark",
      "Verification (audit) and remediation of each control",
      "The exception process where a control cannot be met",
    ],
    roles: [
      { role: "Corporate Cybersecurity – Governance", responsibilities: ["Define and maintain this security standard", "Approve exceptions and periodic reviews"] },
      { role: "System / Platform Owners", responsibilities: ["Ensure in-scope systems are configured to this standard", "Remediate gaps identified during audits"] },
      { role: "System Administrators / Engineers", responsibilities: ["Apply the technical controls during build and operation", "Maintain configuration over the system lifecycle"] },
      { role: "Identity & Access Management", responsibilities: ["Enforce access-related controls defined in this standard"] },
      { role: "Internal Audit / Assurance", responsibilities: ["Independently verify compliance with this standard"] },
      { role: "Third Parties / Vendors", responsibilities: ["Comply with this standard for any in-scope systems they manage"] },
    ],
    complianceIntro:
      "Compliance with this standard is mandatory for all in-scope systems. Compliance is verified " +
      "through configuration reviews, automated scanning and periodic audits using the audit " +
      "procedures defined for each control.",
    complianceExceptionFields: [
      "The specific control(s) that cannot be met",
      "The business or technical justification",
      "The compensating controls in place to mitigate the residual risk",
      "The approver and the review/expiry date of the exception",
    ],
    complianceEnforcement:
      "Non-compliance without an approved exception may result in the system being remediated, " +
      "isolated or removed from the environment, and may be subject to the organisation's " +
      "disciplinary and contractual processes.",
  };
}

const MODEL = process.env.POLICY_LLM_MODEL || "claude-opus-4-8";

export function aiAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

// Best-effort AI drafting via the Anthropic Messages API. Returns null on any failure so
// the caller falls back to staticNarrative — policy generation never depends on the API.
export async function aiNarrative(p: PolicyInput): Promise<Narrative | null> {
  if (!aiAvailable()) return null;
  const system =
    "You draft precise, professional corporate cybersecurity policy text. Write in plain, formal " +
    "enterprise English — no markdown, no bullet characters, one idea per string. Be specific to the " +
    "technology at hand. Never invent technical security controls: the concrete controls come from the " +
    "benchmark verbatim elsewhere in the document; your job is only the surrounding narrative.";
  const sections = p.sectionTitles.slice(0, 50).join("; ") || "(no sections parsed)";
  const prompt =
    `Draft the narrative sections of a cybersecurity hardening standard for ${p.org}, for: ${p.benchTitle}` +
    (p.benchVersion ? ` (version ${p.benchVersion})` : "") +
    `.\nPlatform: ${p.platform || "the in-scope technology"}.\nThe standard operationalises this benchmark; ` +
    `it contains ${p.controlCount} technical controls across these sections: ${sections}.\n\n` +
    `Return ONLY a JSON object (no prose, no code fences) with exactly these keys: ` +
    `purposeIntro (string), purposePoints (string[]), purposeAims (string[]), scopeIntro (string), ` +
    `scopeAppliesTo (string[]), scopeCovers (string[]), roles (array of {role, responsibilities:string[]}), ` +
    `complianceIntro (string), complianceExceptionFields (string[]), complianceEnforcement (string). ` +
    `Provide 3-5 items for each list and 5-7 roles. Do not restate individual controls.`;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY as string,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = (data.content || []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
    const jsonStr = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const parsed = JSON.parse(jsonStr);
    // Merge onto the static defaults so any missing field stays populated.
    const base = staticNarrative(p);
    return {
      purposeIntro: str(parsed.purposeIntro) || base.purposeIntro,
      purposePoints: arr(parsed.purposePoints) || base.purposePoints,
      purposeAims: arr(parsed.purposeAims) || base.purposeAims,
      scopeIntro: str(parsed.scopeIntro) || base.scopeIntro,
      scopeAppliesTo: arr(parsed.scopeAppliesTo) || base.scopeAppliesTo,
      scopeCovers: arr(parsed.scopeCovers) || base.scopeCovers,
      roles: Array.isArray(parsed.roles) && parsed.roles.length
        ? parsed.roles.filter((r: Role) => r && r.role).map((r: Role) => ({ role: String(r.role), responsibilities: arr(r.responsibilities) || ["Comply with this standard"] }))
        : base.roles,
      complianceIntro: str(parsed.complianceIntro) || base.complianceIntro,
      complianceExceptionFields: arr(parsed.complianceExceptionFields) || base.complianceExceptionFields,
      complianceEnforcement: str(parsed.complianceEnforcement) || base.complianceEnforcement,
    };
  } catch {
    return null;
  }
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
function arr(v: unknown): string[] | null {
  return Array.isArray(v) && v.length ? v.map(String) : null;
}

// Resolve the narrative: AI when available, else static. Never throws.
export async function resolveNarrative(p: PolicyInput): Promise<{ narrative: Narrative; aiUsed: boolean }> {
  const ai = await aiNarrative(p);
  return ai ? { narrative: ai, aiUsed: true } : { narrative: staticNarrative(p), aiUsed: false };
}
