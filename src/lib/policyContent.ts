// Shared policy content model. Produces an ordered list of document "blocks" from the
// benchmark controls + narrative, so BOTH the built-in generator (src/lib/policy.ts) and
// the customer-template injector (src/lib/policyTemplate.ts) render the same content.

import type { FullControl } from "./hub/controlContent";
import type { Narrative } from "./policyNarrative";

export type PolicyMeta = {
  org: string;
  title: string;
  version: string;
  author: string;
  date: string;
  color: string;
  classification: string;
  platform: string;
  benchTitle: string;
  benchVersion: string;
};

export type Block =
  | { t: "h1"; text: string }
  | { t: "h2"; text: string }
  | { t: "h3"; text: string }
  | { t: "p"; text: string }
  | { t: "li"; text: string }
  | { t: "kv"; label: string; text: string }
  | { t: "role"; role: string; resp: string[] };

function sections(controls: FullControl[]): { title: string; controls: FullControl[] }[] {
  const order: string[] = [];
  const map = new Map<string, FullControl[]>();
  for (const c of controls) {
    const fam = c.family || "General";
    if (!map.has(fam)) { map.set(fam, []); order.push(fam); }
    map.get(fam)!.push(c);
  }
  return order.map((title) => ({ title, controls: map.get(title)! }));
}

export function policyBlocks(meta: PolicyMeta, controls: FullControl[], n: Narrative): Block[] {
  const b: Block[] = [];
  const secs = sections(controls);
  const titledCount = secs.filter((s) => s.title.trim()).length;

  b.push({ t: "h1", text: "1. Purpose" });
  b.push({ t: "p", text: n.purposeIntro });
  b.push({ t: "p", text: "This standard ensures that in-scope systems are:" });
  n.purposePoints.forEach((x) => b.push({ t: "li", text: x }));
  b.push({ t: "p", text: "Additionally, this standard aims to:" });
  n.purposeAims.forEach((x) => b.push({ t: "li", text: x }));

  b.push({ t: "h1", text: "2. Scope" });
  b.push({ t: "p", text: n.scopeIntro });
  b.push({ t: "p", text: "This standard applies to:" });
  n.scopeAppliesTo.forEach((x) => b.push({ t: "li", text: x }));
  b.push({ t: "p", text: "This standard covers:" });
  n.scopeCovers.forEach((x) => b.push({ t: "li", text: x }));

  b.push({ t: "h1", text: "3. Roles & Responsibilities" });
  b.push({ t: "p", text: "The following roles are responsible for the definition, implementation and assurance of this standard." });
  n.roles.forEach((r) => b.push({ t: "role", role: r.role, resp: r.responsibilities }));

  b.push({ t: "h1", text: "4. Security Requirements" });
  b.push({
    t: "p",
    text:
      `This section defines the mandatory security controls for ${meta.platform || "in-scope systems"}, derived from the ` +
      `${meta.benchTitle}${meta.benchVersion ? ` (${meta.benchVersion})` : ""}. It contains ${controls.length} control(s)` +
      `${titledCount ? ` across ${titledCount} section(s)` : ""}. Each control lists its assurance level, rationale, the audit ` +
      `procedure used to verify it, and the remediation required to meet it. All controls are mandatory unless a formal ` +
      `exception has been approved (see Compliance & Exceptions).`,
  });
  for (const sec of secs) {
    if (sec.title.trim()) b.push({ t: "h2", text: sec.title });
    for (const c of sec.controls) {
      const lvl = c.profile ? ` (${c.profile})` : "";
      b.push({ t: "h3", text: `${c.id} ${c.title}${lvl}`.trim() });
      if (c.nist && c.nist !== "—") b.push({ t: "kv", label: "Maps to NIST 800-53", text: c.nist });
      if (c.rationale) b.push({ t: "kv", label: "Rationale", text: c.rationale });
      if (c.audit) b.push({ t: "kv", label: "Audit", text: c.audit });
      if (c.remediation) b.push({ t: "kv", label: "Remediation", text: c.remediation });
    }
  }

  b.push({ t: "h1", text: "5. Compliance & Exceptions" });
  b.push({ t: "p", text: n.complianceIntro });
  b.push({ t: "p", text: "Where a control cannot be technically or operationally met, a formal exception must be requested and risk-assessed before deployment. Each exception shall record:" });
  n.complianceExceptionFields.forEach((x) => b.push({ t: "li", text: x }));
  b.push({ t: "p", text: n.complianceEnforcement });

  b.push({ t: "h1", text: "6. References" });
  [
    `${meta.benchTitle}${meta.benchVersion ? `, ${meta.benchVersion}` : ""}`,
    "DISA Security Technical Implementation Guides — https://public.cyber.mil/stigs/",
    "NIST SP 800-53 Rev 5 — https://csrc.nist.gov/",
    `${meta.org} Corporate Cybersecurity Standards`,
  ].forEach((x) => b.push({ t: "li", text: x }));

  return b;
}
