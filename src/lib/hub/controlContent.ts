// Server-side control content for the generation engine.
// IMPORTANT (§11 licensing): this text is ORIGINAL, written to *map* to the CIS Windows Server
// benchmark structure — it is NOT a verbatim copy of any copyrighted benchmark. ODP placeholders
// (e.g. {{password_history}}) are substituted with the customer's organization-defined values.

export type FullControl = {
  id: string;
  family: string;
  title: string;
  severity: string;
  profile: string;
  rationale: string;
  audit: string;
  remediation: string; // may contain {{odp_key}} placeholders
  nist: string;
  csf: string;
  iso: string;
};

// ODP key → placeholder token used in remediation text.
export const ODP_TOKENS: Record<string, string> = {
  pwlen: "min_password_length",
  lockout: "lockout_threshold",
  logret: "log_retention_days",
  sessions: "session_lock_minutes",
};

export const WINDOWS_CONTROLS: FullControl[] = [
  {
    id: "1.1.1", family: "Account Policies", title: "Enforce password history — 24 or more passwords", severity: "High", profile: "L1",
    rationale: "Reusing former passwords weakens account security by allowing previously-compromised credentials to be reinstated. Retaining a long password history forces users to choose genuinely new secrets each rotation cycle.",
    audit: "Verify the effective 'Enforce password history' policy resolves to 24 or more remembered passwords via the resultant set of policy.",
    remediation: "Set Computer Configuration → Policies → Windows Settings → Security Settings → Account Policies → Password Policy → 'Enforce password history' to {{password_history}} or more remembered passwords.",
    nist: "IA-5(1)", csf: "PR.AC-1", iso: "A.5.17",
  },
  {
    id: "1.1.2", family: "Account Policies", title: "Maximum password age — 365 or fewer days", severity: "Medium", profile: "L1",
    rationale: "Passwords that never expire increase the window in which a compromised credential remains usable. A bounded maximum age limits that exposure.",
    audit: "Confirm the maximum password age is configured to 365 days or fewer and is greater than zero.",
    remediation: "Set 'Maximum password age' to 365 or fewer days (and not 0). Minimum password length should be at least {{min_password_length}} characters.",
    nist: "IA-5(1)", csf: "PR.AC-1", iso: "A.5.17",
  },
  {
    id: "1.2.1", family: "Account Policies", title: "Account lockout duration — 15 or more minutes", severity: "Medium", profile: "L1",
    rationale: "Locking an account for a meaningful interval after repeated failures slows online password-guessing attacks.",
    audit: "Verify the account lockout duration is 15 minutes or greater.",
    remediation: "Set 'Account lockout threshold' to {{lockout_threshold}} invalid attempts and 'Account lockout duration' to 15 or more minutes.",
    nist: "AC-7", csf: "PR.AC-7", iso: "A.8.5",
  },
  {
    id: "2.3.1.1", family: "Local Policies", title: "Accounts: Block Microsoft accounts", severity: "Medium", profile: "L1",
    rationale: "Blocking Microsoft-account use keeps authentication under organizational control and prevents credential sprawl to unmanaged consumer identities.",
    audit: "Confirm the policy is set to 'Users can't add or log on with Microsoft accounts'.",
    remediation: "Set 'Accounts: Block Microsoft accounts' to 'Users can't add or log on with Microsoft accounts'.",
    nist: "AC-2", csf: "PR.AC-4", iso: "A.5.15",
  },
  {
    id: "2.3.7.1", family: "Local Policies", title: "Machine inactivity limit — 900 seconds", severity: "Low", profile: "L1",
    rationale: "Automatically locking an idle session reduces the risk of unauthorized access to an unattended, logged-on workstation.",
    audit: "Verify the interactive logon machine inactivity limit is 900 seconds or fewer (and not 0).",
    remediation: "Set 'Interactive logon: Machine inactivity limit' to {{session_lock_minutes}} minutes (expressed in seconds) or fewer, and greater than 0.",
    nist: "AC-11", csf: "PR.AC-7", iso: "A.8.5",
  },
  {
    id: "9.1.1", family: "Windows Firewall", title: "Windows Firewall: Domain profile state — On", severity: "High", profile: "L1",
    rationale: "An enabled host firewall on the domain profile provides defense-in-depth against lateral movement and unsolicited inbound connections.",
    audit: "Confirm the Windows Defender Firewall 'Domain' profile 'Firewall state' is 'On (recommended)'.",
    remediation: "Set Windows Defender Firewall → Domain Profile → 'Firewall state' to 'On (recommended)'. Retain firewall logs for {{log_retention_days}} days.",
    nist: "SC-7", csf: "PR.PT-4", iso: "A.8.20",
  },
  {
    id: "17.1.1", family: "Advanced Audit Policy", title: "Audit Credential Validation — Success and Failure", severity: "Medium", profile: "L1",
    rationale: "Auditing credential validation produces the authentication trail needed to detect brute-force and credential-abuse activity.",
    audit: "Verify the 'Audit Credential Validation' subcategory is configured for both Success and Failure.",
    remediation: "Set 'Audit Credential Validation' to 'Success and Failure'. Ensure security event logs are retained for {{log_retention_days}} days.",
    nist: "AU-2", csf: "PR.PT-1", iso: "A.8.15",
  },
  {
    id: "18.9.4.1", family: "Administrative Templates", title: "Configure SMB v1 client driver — Disabled", severity: "High", profile: "L1",
    rationale: "SMBv1 is an obsolete protocol with known critical vulnerabilities. Disabling the client driver removes a widely-exploited attack surface.",
    audit: "Confirm the MrxSmb10 driver start policy is set to 'Disable driver'.",
    remediation: "Set 'Configure SMB v1 client driver' to 'Enabled: Disable driver (recommended)'.",
    nist: "CM-7", csf: "PR.IP-1", iso: "A.8.9",
  },
  {
    id: "18.10.7.2", family: "Administrative Templates", title: "Prevent installation of removable devices", severity: "Low", profile: "L2",
    rationale: "Restricting removable-device installation limits data exfiltration and malware introduction via USB and similar media.",
    audit: "Verify 'Prevent installation of removable devices' is Enabled.",
    remediation: "Set 'Prevent installation of removable devices' to 'Enabled'.",
    nist: "MP-7", csf: "PR.PT-2", iso: "A.8.7",
  },
  {
    id: "19.7.4.1", family: "User Templates", title: "Do not preserve zone information on attachments", severity: "Low", profile: "L1",
    rationale: "Preserving zone-of-origin metadata ensures downloaded attachments are still subject to security-zone handling and Mark-of-the-Web protections.",
    audit: "Confirm 'Do not preserve zone information in file attachments' is Disabled.",
    remediation: "Set 'Do not preserve zone information in file attachments' to 'Disabled'.",
    nist: "SI-3", csf: "PR.IP-1", iso: "A.8.7",
  },
];

// Substitute ODP values (keyed by odp field) into remediation text.
export function substituteOdp(text: string, odp: Record<string, string>): string {
  const values: Record<string, string> = {
    password_history: "24",
    min_password_length: odp.pwlen ?? "14",
    lockout_threshold: odp.lockout ?? "5",
    log_retention_days: odp.logret ?? "365",
    session_lock_minutes: odp.sessions ?? "15",
  };
  return text.replace(/\{\{(\w+)\}\}/g, (_, k: string) => values[k] ?? `{{${k}}}`);
}
