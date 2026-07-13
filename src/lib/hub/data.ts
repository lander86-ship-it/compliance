// Catalog + content data, ported verbatim from the design mockup (HardenHub.dc.html).
// This is the demo dataset the SPA renders; the generation engine seeds the same
// controls into the database (prisma/seed.ts) so generated documents use real data.

export type Product = {
  id: string;
  framework: string;
  platform: string;
  name: string;
  version: string;
  blurb: string;
  controls: number;
  profiles: string;
  formats: string;
  price: string;
  savings: string;
  type: string;
};

export type Bundle = {
  id: string;
  family: string;
  framework: string;
  name: string;
  tagline: string;
  price: string;
  count: number;
  savings: string;
  featured?: boolean;
  includes: string[];
};

export const PRODUCTS: Product[] = [
  { id: "cis-win2022", framework: "CIS", platform: "Windows Server", name: "CIS Windows Server 2022 Benchmark", version: "v2.0.0", blurb: "Secure-configuration baseline for Windows Server 2022 — domain controller and member server profiles.", controls: 387, profiles: "L1 · L2", formats: "DOCX·PDF·XLSX", price: "$1,290", savings: "$18k", type: "Hardening guide" },
  { id: "cis-ubuntu2204", framework: "CIS", platform: "Linux", name: "CIS Ubuntu 22.04 LTS Benchmark", version: "v2.0.0", blurb: "Hardening baseline for Ubuntu 22.04 LTS servers and workstations across L1/L2 profiles.", controls: 241, profiles: "L1 · L2", formats: "DOCX·PDF·XLSX", price: "$990", savings: "$12k", type: "Hardening guide" },
  { id: "stig-rhel9", framework: "DISA STIG", platform: "Linux", name: "DISA STIG — Red Hat Enterprise Linux 9", version: "V1R3", blurb: "DoD Security Technical Implementation Guide for RHEL 9, mapped to NIST 800-53 controls.", controls: 312, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$1,150", savings: "$16k", type: "Standard" },
  { id: "cis-k8s", framework: "CIS", platform: "Kubernetes", name: "CIS Kubernetes Benchmark", version: "v1.9.0", blurb: "Control-plane and worker-node hardening for self-managed Kubernetes clusters.", controls: 124, profiles: "L1 · L2", formats: "DOCX·PDF·XLSX", price: "$860", savings: "$9k", type: "Hardening guide" },
  { id: "cis-aws", framework: "CIS", platform: "AWS", name: "CIS AWS Foundations Benchmark", version: "v3.0.0", blurb: "Account-level security baseline for Amazon Web Services — IAM, logging, monitoring, networking.", controls: 78, profiles: "L1 · L2", formats: "DOCX·PDF·XLSX", price: "$740", savings: "$7k", type: "Hardening guide" },
  { id: "nist-80053", framework: "NIST 800-53", platform: "Policy", name: "NIST 800-53 Rev 5 Moderate Baseline", version: "Rev 5", blurb: "Original policy content mapped to the NIST 800-53 moderate control baseline — public-domain source.", controls: 287, profiles: "Moderate", formats: "DOCX·PDF·XLSX", price: "$1,090", savings: "$14k", type: "Standard" },
];

export const FAMILIES = [
  { id: "hardening", label: "Hardening Guides", desc: "Technical secure-configuration baselines by platform — CIS Benchmarks, DISA STIG, sold as platform packs." },
  { id: "standards", label: "Security Standards & Policies", desc: "Editable policies, procedures and compliance programs mapped to frameworks — sold as governance packs." },
];

export const BUNDLES: Bundle[] = [
  { id: "pk-hard-all", family: "hardening", framework: "PACK", name: "Complete Hardening Suite", tagline: "Every hardening guide across OS, cloud, containers, network and databases.", price: "$6,900", count: 42, savings: "$60k", featured: true, includes: ["Operating Systems Pack (12 guides)", "Cloud Hardening Pack (9 guides)", "Container & Orchestration Pack (5 guides)", "Network & Database Pack (8 guides)", "All future additions for 12 months"] },
  { id: "pk-hard-os", family: "hardening", framework: "PACK", name: "Operating Systems Pack", tagline: "Windows Server, Windows 11, Ubuntu, RHEL, Debian and macOS baselines.", price: "$2,490", count: 12, savings: "$22k", includes: ["CIS Windows Server 2022 & 2019", "CIS Windows 11 Enterprise", "CIS Ubuntu 22.04 LTS", "DISA STIG — RHEL 9", "CIS Debian 12", "CIS macOS 14"] },
  { id: "pk-hard-cloud", family: "hardening", framework: "PACK", name: "Cloud Hardening Pack", tagline: "Account-level baselines for the major cloud and SaaS platforms.", price: "$2,190", count: 9, savings: "$18k", includes: ["CIS AWS Foundations", "CIS Microsoft Azure", "CIS Microsoft 365", "CIS Google Cloud Platform"] },
  { id: "pk-hard-cont", family: "hardening", framework: "PACK", name: "Container & Orchestration Pack", tagline: "Control-plane, node and runtime hardening for containerized workloads.", price: "$1,290", count: 5, savings: "$9k", includes: ["CIS Kubernetes Benchmark", "CIS Docker Benchmark", "DISA STIG — Kubernetes"] },
  { id: "pk-hard-net", family: "hardening", framework: "PACK", name: "Network & Database Pack", tagline: "Network devices and database engines in a single hardening pack.", price: "$1,690", count: 8, savings: "$12k", includes: ["CIS Cisco IOS 17", "CIS Palo Alto PAN-OS", "CIS PostgreSQL 16", "CIS Microsoft SQL Server", "CIS Oracle MySQL"] },
  { id: "pk-std-all", family: "standards", framework: "PACK", name: "Complete Standards Suite", tagline: "Every editable policy, procedure and compliance program we publish.", price: "$7,900", count: 38, savings: "$70k", featured: true, includes: ["Governance Standards Pack", "NIST 800-53 Compliance Pack", "NIST 800-171 / CMMC Pack", "PCI DSS Compliance Pack", "All future additions for 12 months"] },
  { id: "pk-std-gov", family: "standards", framework: "PACK", name: "Governance Standards Pack", tagline: "Policies + procedures for SCF, NIST CSF 2.0 and ISO 27001/27002.", price: "$2,990", count: 14, savings: "$26k", includes: ["Policies & Standards — Secure Controls Framework", "Policies & Standards — NIST CSF 2.0", "Policies & Standards — ISO 27001/27002", "Matching editable procedures", "Cybersecurity Business Plan (CBP)"] },
  { id: "pk-std-nist", family: "standards", framework: "PACK", name: "NIST 800-53 Compliance Pack", tagline: "Moderate and high baselines with policies, procedures and SSP.", price: "$2,490", count: 9, savings: "$20k", includes: ["Policies & Standards — NIST 800-53 R5 (moderate)", "Policies & Standards — NIST 800-53 R5 (high)", "Matching editable procedures", "System Security Program (SSP)"] },
  { id: "pk-std-171", family: "standards", framework: "PACK", name: "NIST 800-171 / CMMC Pack", tagline: "Everything to stand up an 800-171 / CMMC compliance program.", price: "$1,890", count: 6, savings: "$14k", includes: ["NIST 800-171 Compliance Program (NCP)", "NIST 800-171 System Security Program (SSP)", "Plan of Action & Milestones (POA&M) template"] },
  { id: "pk-std-pci", family: "standards", framework: "PACK", name: "PCI DSS Compliance Pack", tagline: "Policies & standards for every PCI DSS v4 SAQ type.", price: "$2,290", count: 8, savings: "$16k", includes: ["PCI DSS v4 SAQ A / A-EP", "PCI DSS v4 SAQ B / B-IP", "PCI DSS v4 SAQ C / C-VT", "PCI DSS v4 SAQ D (Merchant & Service Provider)"] },
];

export const DIRECTORY: Record<string, { cat: string; items: string[] }[]> = {
  hardening: [
    { cat: "Operating Systems", items: ["CIS Windows Server 2022", "CIS Windows Server 2019", "CIS Windows 11 Enterprise", "CIS Ubuntu 22.04 LTS", "DISA STIG — RHEL 9", "CIS Debian 12", "CIS macOS 14"] },
    { cat: "Cloud Platforms", items: ["CIS AWS Foundations", "CIS Microsoft Azure", "CIS Microsoft 365", "CIS Google Cloud Platform"] },
    { cat: "Containers & Orchestration", items: ["CIS Kubernetes", "CIS Docker", "DISA STIG — Kubernetes"] },
    { cat: "Network & Infrastructure", items: ["CIS Cisco IOS 17", "CIS Palo Alto PAN-OS", "CIS Juniper JunOS"] },
    { cat: "Databases", items: ["CIS PostgreSQL 16", "CIS Microsoft SQL Server", "CIS Oracle MySQL"] },
  ],
  standards: [
    { cat: "Editable Policies & Standards", items: ["Secure Controls Framework (SCF)", "NIST CSF 2.0", "ISO 27001 / 27002", "NIST 800-53 R5 (moderate)", "NIST 800-53 R5 (high)", "CORE Fundamentals"] },
    { cat: "Editable Procedures", items: ["Procedures — SCF", "Procedures — NIST CSF 2.0", "Procedures — ISO 27001/27002", "Procedures — NIST 800-53 R5"] },
    { cat: "NIST 800-171 Compliance", items: ["800-171 Compliance Program (NCP)", "800-171 System Security Program (SSP)"] },
    { cat: "PCI DSS Compliance", items: ["PCI DSS v4 SAQ A", "PCI DSS v4 SAQ A-EP", "PCI DSS v4 SAQ B / B-IP", "PCI DSS v4 SAQ C / C-VT", "PCI DSS v4 SAQ D (Merchant)", "PCI DSS v4 SAQ D (Service Provider)"] },
    { cat: "Risk & Governance", items: ["Risk Management Program (RMP)", "Third-Party Risk Management (TPRM)", "Cybersecurity Risk Assessment (CRA)", "Continuity of Operations (COOP)"] },
  ],
};

export const SAMPLE = [
  { id: "1.1.1", severity: "High", profile: "L1", title: "Ensure 'Enforce password history' is set to '24 or more password(s)'", rationale: "Reusing old passwords weakens account security by allowing compromised credentials to be re-enabled. A long history forces genuinely new passwords." },
  { id: "2.3.1.1", severity: "Medium", profile: "L1", title: "Ensure 'Accounts: Block Microsoft accounts' is set to 'Users can't add or log on with Microsoft accounts'", rationale: "Blocking Microsoft account use keeps authentication under organizational control and prevents credential sprawl to unmanaged identities." },
];

export const WIZ_CONTROLS = [
  { id: "1.1.1", family: "Account Policies", title: "Enforce password history — 24 or more passwords", severity: "High" },
  { id: "1.1.2", family: "Account Policies", title: "Maximum password age — 365 or fewer days", severity: "Medium" },
  { id: "1.2.1", family: "Account Policies", title: "Account lockout duration — 15 or more minutes", severity: "Medium" },
  { id: "2.3.1.1", family: "Local Policies", title: "Block Microsoft accounts", severity: "Medium" },
  { id: "2.3.7.1", family: "Local Policies", title: "Machine inactivity limit — 900 seconds", severity: "Low" },
  { id: "9.1.1", family: "Windows Firewall", title: "Domain profile firewall state — On", severity: "High" },
  { id: "17.1.1", family: "Advanced Audit Policy", title: "Audit Credential Validation — Success and Failure", severity: "Medium" },
  { id: "18.9.4.1", family: "Administrative Templates", title: "Configure SMB v1 client driver — Disabled", severity: "High" },
  { id: "18.10.7.2", family: "Administrative Templates", title: "Prevent installation of removable devices", severity: "Low" },
  { id: "19.7.4.1", family: "User Templates", title: "Do not preserve zone information on attachments", severity: "Low" },
];

export const MAPPINGS = [
  { src: "1.1.1", nist: "IA-5(1)", csf: "PR.AC-1", iso: "A.5.17" },
  { src: "2.3.1.1", nist: "AC-2", csf: "PR.AC-4", iso: "A.5.15" },
  { src: "2.3.7.1", nist: "AC-11", csf: "PR.AC-7", iso: "A.8.5" },
  { src: "18.9.x", nist: "CM-6", csf: "PR.IP-1", iso: "A.8.9" },
];

// ── Back-office demo data ──
export const KPIS = [
  { k: "Revenue (30d)", v: "$142,380", d: "+18%", deltaColor: "#1f7a4d" },
  { k: "Orders", v: "96", d: "+12%", deltaColor: "#1f7a4d" },
  { k: "Conversion", v: "4.7%", d: "+0.6pt", deltaColor: "#1f7a4d" },
  { k: "Avg. order value", v: "$1,483", d: "−2%", deltaColor: "#b4381f" },
];

export const TOP_PRODUCTS = [
  { name: "CIS Windows Server 2022", rev: "$38,700", units: 30, pct: 82 },
  { name: "DISA STIG — RHEL 9", rev: "$27,600", units: 24, pct: 64 },
  { name: "CIS Ubuntu 22.04 LTS", rev: "$21,780", units: 22, pct: 52 },
  { name: "NIST 800-53 Moderate", rev: "$18,530", units: 17, pct: 42 },
  { name: "CIS AWS Foundations", rev: "$12,580", units: 17, pct: 30 },
];

export const REV_BY_FW = [
  { fw: "CIS", pct: 58, c: "#0f4c9c" },
  { fw: "DISA STIG", pct: 22, c: "#6a2f6a" },
  { fw: "NIST", pct: 20, c: "#1f6a4d" },
];

export const ORDERS = [
  { id: "#HH-2041", org: "Northwind Financial Group", total: "$2,280", status: "Paid", c: "#1f7a4d" },
  { id: "#HH-2040", org: "Meridian Health Systems", total: "$1,150", status: "PO pending", c: "#b5721c" },
  { id: "#HH-2039", org: "Apex Manufacturing", total: "$3,140", status: "Paid", c: "#1f7a4d" },
  { id: "#HH-2038", org: "Cobalt Logistics", total: "$860", status: "Refunded", c: "#b4381f" },
  { id: "#HH-2037", org: "Vanta Retail Group", total: "$1,730", status: "Paid", c: "#1f7a4d" },
];

export const DIFF_ROWS = [
  { t: "added", label: "Added", c: "#1f7a4d", sign: "+", items: "12 controls", note: "New Credential Guard & LAPS recommendations" },
  { t: "modified", label: "Modified", c: "#b5721c", sign: "~", items: "34 controls", note: "Updated audit / remediation text" },
  { t: "removed", label: "Removed", c: "#b4381f", sign: "−", items: "5 controls", note: "Deprecated SMBv1 legacy items" },
];

export const LIBRARY_ITEMS = [
  { name: "CIS Windows Server 2022 Benchmark", version: "v2.0.0", fw: "CIS", status: "Ready", statusColor: "#1f7a4d", gens: "2 of 5 generations used", artifacts: ["DOCX", "PDF", "XLSX"], configured: true, productId: "cis-win2022" },
  { name: "CIS Ubuntu 22.04 LTS Benchmark", version: "v2.0.0", fw: "CIS", status: "Needs scope", statusColor: "#b5721c", gens: "0 of 5 generations used", artifacts: [] as string[], configured: false, productId: "cis-ubuntu2204" },
  { name: "DISA STIG — RHEL 9", version: "V1R3", fw: "DISA STIG", status: "Update available", statusColor: "#1663d6", gens: "1 of 5 generations used", artifacts: ["DOCX", "PDF"], configured: true, productId: "stig-rhel9" },
];

export const AI_STAGES = [
  "Fetching source document",
  "Extracting recommendations",
  "Normalizing to Control schema",
  "Drafting original mapped content",
  "Cross-mapping frameworks (NIST · ISO · CSF)",
];

export function findItem(id: string): Product | Bundle | undefined {
  return PRODUCTS.find((p) => p.id === id) || BUNDLES.find((b) => b.id === id);
}

export function priceNum(s: string): number {
  return Number(String(s).replace(/[^0-9.]/g, ""));
}
export function fmt(n: number): string {
  return "$" + n.toLocaleString("en-US");
}
