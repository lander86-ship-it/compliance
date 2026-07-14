// Server-side loader for ingested DISA STIG data (public-domain, reproduction permitted).
// Reads the JSON produced by scripts/import-xccdf.mjs + enrich-cci.mjs.

import fs from "fs";
import path from "path";
import type { FullControl } from "./controlContent";

export type StigControl = {
  code: string;
  vulnId: string;
  ruleId: string;
  title: string;
  severity: string; // high | medium | low
  cat: string; // CAT I | CAT II | CAT III
  srg: string;
  rationale: string;
  audit: string;
  remediation: string;
  ccis: string[];
  nist: string[];
};
export type StigDoc = { slug: string; benchTitle: string; release: string; controls: StigControl[] };

// Product slug (catalog) → ingested STIG data file.
export const STIG_PRODUCTS: Record<string, { slug: string; name: string; platform: string; version: string }> = {
  "stig-rhel9": { slug: "stig-rhel9", name: "DISA STIG — Red Hat Enterprise Linux 9", platform: "Linux", version: "V2R4" },
  "stig-win2022": { slug: "stig-win2022", name: "DISA STIG — Microsoft Windows Server 2022", platform: "Windows Server", version: "V2R4" },
  "stig-win2019": { slug: "stig-win2019", name: "DISA STIG — Microsoft Windows Server 2019", platform: "Windows Server", version: "V3R5" },
  "stig-win11": { slug: "stig-win11", name: "DISA STIG — Microsoft Windows 11", platform: "Windows", version: "V2R4" },
  "stig-ubuntu2204": { slug: "stig-ubuntu2204", name: "DISA STIG — Canonical Ubuntu 22.04 LTS", platform: "Linux", version: "V2R5" },
  "stig-k8s": { slug: "stig-k8s", name: "DISA STIG — Kubernetes", platform: "Kubernetes", version: "V2R4" },
  "stig-macos14": { slug: "stig-macos14", name: "DISA STIG — Apple macOS 14 (Sonoma)", platform: "macOS", version: "V2R4" },
  "stig-postgresql": { slug: "stig-postgresql", name: "DISA STIG — Crunchy Data PostgreSQL", platform: "Database", version: "V2R2" },
  "stig-cisco-ios-rtr": { slug: "stig-cisco-ios-rtr", name: "DISA STIG — Cisco IOS XE Router (RTR)", platform: "Network", version: "V3R1" },
  "stig-win2016": { slug: "stig-win2016", name: "DISA STIG — Microsoft Windows Server 2016", platform: "Windows Server", version: "V2R10" },
  "stig-win10": { slug: "stig-win10", name: "DISA STIG — Microsoft Windows 10", platform: "Windows", version: "V3R6" },
  "stig-rhel8": { slug: "stig-rhel8", name: "DISA STIG — Red Hat Enterprise Linux 8", platform: "Linux", version: "V2R8" },
  "stig-mssql2016": { slug: "stig-mssql2016", name: "DISA STIG — Microsoft SQL Server 2016 Instance", platform: "Database", version: "V3R6" },
  "stig-iis10": { slug: "stig-iis10", name: "DISA STIG — Microsoft IIS 10.0 Server", platform: "Web", version: "V3R7" },
  "stig-apache24": { slug: "stig-apache24", name: "DISA STIG — Apache Server 2.4 (UNIX)", platform: "Web", version: "V2R3" },
  "stig-docker": { slug: "stig-docker", name: "DISA STIG — Docker Enterprise 2.x", platform: "Containers", version: "V2R1" },
  "stig-cisco-switch-ndm": { slug: "stig-cisco-switch-ndm", name: "DISA STIG — Cisco IOS XE Switch (NDM)", platform: "Network", version: "V3R4" },
  "stig-cisco-switch-l2s": { slug: "stig-cisco-switch-l2s", name: "DISA STIG — Cisco IOS XE Switch (L2S)", platform: "Network", version: "V3R2" },
  "stig-vsphere8-esxi": { slug: "stig-vsphere8-esxi", name: "DISA STIG — VMware vSphere 8.0 ESXi", platform: "Virtualization", version: "V2R4" },
  "stig-rhel7": { slug: "stig-rhel7", name: "DISA STIG — Red Hat Enterprise Linux 7", platform: "Linux", version: "V3R15" },
  "stig-oracle19c": { slug: "stig-oracle19c", name: "DISA STIG — Oracle Database 19c", platform: "Database", version: "V1R5" },
  "stig-mongodb7": { slug: "stig-mongodb7", name: "DISA STIG — MongoDB Enterprise Advanced 7.x", platform: "Database", version: "V1R2" },
  "stig-cisco-asa-ndm": { slug: "stig-cisco-asa-ndm", name: "DISA STIG — Cisco ASA (NDM)", platform: "Network", version: "V2R5" },
  "stig-cisco-nxos-ndm": { slug: "stig-cisco-nxos-ndm", name: "DISA STIG — Cisco NX-OS Switch (NDM)", platform: "Network", version: "V2R3" },
  "stig-paloalto-ndm": { slug: "stig-paloalto-ndm", name: "DISA STIG — Palo Alto Networks (NDM)", platform: "Network", version: "V3R4" },
  "stig-f5-bigip-ndm": { slug: "stig-f5-bigip-ndm", name: "DISA STIG — F5 BIG-IP Device Management", platform: "Network", version: "V2R4" },
  "stig-vsphere8-vcenter": { slug: "stig-vsphere8-vcenter", name: "DISA STIG — VMware vSphere 8.0 vCenter", platform: "Virtualization", version: "V2R4" },
  "stig-chrome": { slug: "stig-chrome", name: "DISA STIG — Google Chrome (Windows)", platform: "Application", version: "V2R11" },
  "stig-juniper-srx-ndm": { slug: "stig-juniper-srx-ndm", name: "DISA STIG — Juniper SRX Services Gateway (NDM)", platform: "Network", version: "V3R2" },
  "stig-juniper-srx-alg": { slug: "stig-juniper-srx-alg", name: "DISA STIG — Juniper SRX Services Gateway (ALG)", platform: "Network", version: "V3R3" },
  "stig-win2012r2": { slug: "stig-win2012r2", name: "DISA STIG — Microsoft Windows Server 2012 / 2012 R2 (MS)", platform: "Windows Server", version: "V3R7" },
  "stig-ubuntu2004": { slug: "stig-ubuntu2004", name: "DISA STIG — Canonical Ubuntu 20.04 LTS", platform: "Linux", version: "V2R4" },
  "stig-sles12": { slug: "stig-sles12", name: "DISA STIG — SUSE Linux Enterprise Server 12", platform: "Linux", version: "V3R2" },
  "stig-solaris11": { slug: "stig-solaris11", name: "DISA STIG — Oracle Solaris 11 (SPARC)", platform: "Linux", version: "V3R6" },
  "stig-aix7": { slug: "stig-aix7", name: "DISA STIG — IBM AIX 7.x", platform: "Linux", version: "V3R3" },
  "stig-postgresql9": { slug: "stig-postgresql9", name: "DISA STIG — PostgreSQL 9.x", platform: "Database", version: "V2R5" },
  "stig-oracle12c": { slug: "stig-oracle12c", name: "DISA STIG — Oracle Database 12c", platform: "Database", version: "V3R5" },
  "stig-tomcat9": { slug: "stig-tomcat9", name: "DISA STIG — Apache Tomcat 9", platform: "Web", version: "V3R4" },
  "stig-cisco-asa-vpn": { slug: "stig-cisco-asa-vpn", name: "DISA STIG — Cisco ASA VPN", platform: "Network", version: "V2R2" },
  "stig-firefox": { slug: "stig-firefox", name: "DISA STIG — Mozilla Firefox", platform: "Application", version: "V6R8" },
  "stig-edge": { slug: "stig-edge", name: "DISA STIG — Microsoft Edge", platform: "Application", version: "V2R5" },
  "stig-adobe-acrobat": { slug: "stig-adobe-acrobat", name: "DISA STIG — Adobe Acrobat Pro DC Continuous", platform: "Application", version: "V1R2" },
  "stig-vsphere8-photon": { slug: "stig-vsphere8-photon", name: "DISA STIG — VMware vSphere 8.0 vCenter Photon OS 4.0", platform: "Virtualization", version: "V2R2" },
  "stig-macos15": { slug: "stig-macos15", name: "DISA STIG — Apple macOS 15 (Sequoia)", platform: "macOS", version: "V1R7" },
  "stig-oracle-linux8": { slug: "stig-oracle-linux8", name: "DISA STIG — Oracle Linux 8", platform: "Linux", version: "V2R9" },
  "stig-vsphere7-esxi": { slug: "stig-vsphere7-esxi", name: "DISA STIG — VMware vSphere 7.0 ESXi", platform: "Virtualization", version: "V1R4" },
  "stig-vsphere7-vcenter": { slug: "stig-vsphere7-vcenter", name: "DISA STIG — VMware vSphere 7.0 vCenter", platform: "Virtualization", version: "V1R3" },
  "stig-cisco-switch-rtr": { slug: "stig-cisco-switch-rtr", name: "DISA STIG — Cisco IOS XE Switch (RTR)", platform: "Network", version: "V3R4" },
  "stig-cisco-iosxr-rtr": { slug: "stig-cisco-iosxr-rtr", name: "DISA STIG — Cisco IOS XR Router (RTR)", platform: "Network", version: "V3R3" },
  "stig-cisco-iosxr-ndm": { slug: "stig-cisco-iosxr-ndm", name: "DISA STIG — Cisco IOS XR Router (NDM)", platform: "Network", version: "V3R6" },
  "stig-f5-bigip-ltm": { slug: "stig-f5-bigip-ltm", name: "DISA STIG — F5 BIG-IP Local Traffic Manager", platform: "Network", version: "V2R4" },
  "stig-paloalto-alg": { slug: "stig-paloalto-alg", name: "DISA STIG — Palo Alto Networks (ALG)", platform: "Network", version: "V3R4" },
  "stig-mongodb4": { slug: "stig-mongodb4", name: "DISA STIG — MongoDB Enterprise Advanced 4.x", platform: "Database", version: "V1R4" },
  "stig-apache24-win": { slug: "stig-apache24-win", name: "DISA STIG — Apache Server 2.4 (Windows)", platform: "Web", version: "V3R4" },
  "stig-iis10-site": { slug: "stig-iis10-site", name: "DISA STIG — Microsoft IIS 10.0 Site", platform: "Web", version: "V2R16" },
  "stig-exchange2019-mbx": { slug: "stig-exchange2019-mbx", name: "DISA STIG — Microsoft Exchange 2019 Mailbox Server", platform: "Application", version: "V2R3" },
  "stig-office365": { slug: "stig-office365", name: "DISA STIG — Microsoft Office 365 ProPlus", platform: "Application", version: "V3R5" },
  "stig-dotnet4": { slug: "stig-dotnet4", name: "DISA STIG — .NET Framework 4.0", platform: "Application", version: "V2R9" },
  "stig-defender-av": { slug: "stig-defender-av", name: "DISA STIG — Microsoft Defender Antivirus", platform: "Application", version: "V2R9" },
  "stig-windows-firewall": { slug: "stig-windows-firewall", name: "DISA STIG — Windows Defender Firewall", platform: "Application", version: "V2R2" },
};

const cache = new Map<string, StigDoc | null>();

export function loadStig(slug: string): StigDoc | null {
  if (cache.has(slug)) return cache.get(slug)!;
  const p = path.join(process.cwd(), "data", "stig", `${slug}.json`);
  let doc: StigDoc | null = null;
  try {
    doc = JSON.parse(fs.readFileSync(p, "utf8")) as StigDoc;
  } catch {
    doc = null;
  }
  cache.set(slug, doc);
  return doc;
}

export function isStigProduct(productId: string): boolean {
  return productId in STIG_PRODUCTS;
}

const CAT_TO_SEV: Record<string, string> = { "CAT I": "High", "CAT II": "Medium", "CAT III": "Low" };

// Family = the STIG id group prefix (e.g. "RHEL-09-21", "WN22-AC"), for grouping controls.
export function familyOf(c: StigControl): string {
  const m = (c.code || "").match(/^([A-Z0-9]+-[A-Z0-9]{2})/i);
  return m ? m[1].toUpperCase() : "General";
}

// Normalize a STIG control to the engine's FullControl shape.
export function toFullControl(c: StigControl): FullControl {
  return {
    id: c.code,
    family: familyOf(c),
    title: c.title,
    severity: CAT_TO_SEV[c.cat] || "Medium",
    profile: c.cat,
    rationale: c.rationale,
    audit: c.audit,
    remediation: c.remediation, // STIG remediation has no ODP placeholders → passthrough
    nist: c.nist && c.nist.length ? c.nist.join(", ") : "—",
    csf: "—",
    iso: "—",
  };
}

// Lightweight control list for the Scope Wizard (id/title/family/severity only).
export function stigControlSummaries(slug: string) {
  const doc = loadStig(slug);
  if (!doc) return [];
  return doc.controls.map((c) => ({ id: c.code, title: c.title, family: familyOf(c), severity: CAT_TO_SEV[c.cat] || "Medium", cat: c.cat }));
}
