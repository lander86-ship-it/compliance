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
  { id: "stig-rhel9", framework: "DISA STIG", platform: "Linux", name: "DISA STIG — Red Hat Enterprise Linux 9", version: "V2R4", blurb: "DoD Security Technical Implementation Guide for RHEL 9, mapped to NIST 800-53. Public-domain source.", controls: 452, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$1,290", savings: "$18k", type: "Standard" },
  { id: "cis-k8s", framework: "CIS", platform: "Kubernetes", name: "CIS Kubernetes Benchmark", version: "v1.9.0", blurb: "Control-plane and worker-node hardening for self-managed Kubernetes clusters.", controls: 124, profiles: "L1 · L2", formats: "DOCX·PDF·XLSX", price: "$860", savings: "$9k", type: "Hardening guide" },
  { id: "cis-aws", framework: "CIS", platform: "AWS", name: "CIS AWS Foundations Benchmark", version: "v3.0.0", blurb: "Account-level security baseline for Amazon Web Services — IAM, logging, monitoring, networking.", controls: 78, profiles: "L1 · L2", formats: "DOCX·PDF·XLSX", price: "$740", savings: "$7k", type: "Hardening guide" },
  { id: "nist-80053", framework: "NIST 800-53", platform: "Policy", name: "NIST 800-53 Rev 5 Moderate Baseline", version: "Rev 5", blurb: "Original policy content mapped to the NIST 800-53 moderate control baseline — public-domain source.", controls: 287, profiles: "Moderate", formats: "DOCX·PDF·XLSX", price: "$1,090", savings: "$14k", type: "Standard" },
  { id: "stig-win2022", framework: "DISA STIG", platform: "Windows Server", name: "DISA STIG — Microsoft Windows Server 2022", version: "V2R4", blurb: "DoD Security Technical Implementation Guide for Windows Server 2022, mapped to NIST 800-53. Public-domain source.", controls: 275, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$1,290", savings: "$17k", type: "Standard" },
  { id: "stig-win2019", framework: "DISA STIG", platform: "Windows Server", name: "DISA STIG — Microsoft Windows Server 2019", version: "V3R5", blurb: "DoD Security Technical Implementation Guide for Windows Server 2019, mapped to NIST 800-53. Public-domain source.", controls: 275, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$1,190", savings: "$16k", type: "Standard" },
  { id: "stig-win11", framework: "DISA STIG", platform: "Windows", name: "DISA STIG — Microsoft Windows 11", version: "V2R4", blurb: "DoD Security Technical Implementation Guide for Windows 11 endpoints, mapped to NIST 800-53. Public-domain source.", controls: 258, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$990", savings: "$13k", type: "Standard" },
  { id: "stig-ubuntu2204", framework: "DISA STIG", platform: "Linux", name: "DISA STIG — Canonical Ubuntu 22.04 LTS", version: "V2R5", blurb: "DoD Security Technical Implementation Guide for Ubuntu 22.04 LTS, mapped to NIST 800-53. Public-domain source.", controls: 187, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$990", savings: "$12k", type: "Standard" },
  { id: "stig-k8s", framework: "DISA STIG", platform: "Kubernetes", name: "DISA STIG — Kubernetes", version: "V2R4", blurb: "DoD Security Technical Implementation Guide for Kubernetes clusters (control plane + nodes), mapped to NIST 800-53. Public-domain source.", controls: 94, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$890", savings: "$9k", type: "Standard" },
  { id: "stig-macos14", framework: "DISA STIG", platform: "macOS", name: "DISA STIG — Apple macOS 14 (Sonoma)", version: "V2R4", blurb: "DoD Security Technical Implementation Guide for macOS 14 Sonoma endpoints, mapped to NIST 800-53. Public-domain source.", controls: 156, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$890", savings: "$10k", type: "Standard" },
  { id: "stig-postgresql", framework: "DISA STIG", platform: "Databases", name: "DISA STIG — Crunchy Data PostgreSQL", version: "V2R2", blurb: "DoD Security Technical Implementation Guide for Crunchy Data PostgreSQL, mapped to NIST 800-53. Public-domain source.", controls: 114, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$890", savings: "$11k", type: "Standard" },
  { id: "stig-cisco-ios-rtr", framework: "DISA STIG", platform: "Network", name: "DISA STIG — Cisco IOS XE Router (RTR)", version: "V3R1", blurb: "DoD Security Technical Implementation Guide for Cisco IOS XE routers (RTR policy), mapped to NIST 800-53. Public-domain source.", controls: 97, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$990", savings: "$12k", type: "Standard" },
  { id: "stig-win2016", framework: "DISA STIG", platform: "Windows Server", name: "DISA STIG — Microsoft Windows Server 2016", version: "V2R10", blurb: "DoD STIG for Windows Server 2016, mapped to NIST 800-53. Public-domain source.", controls: 273, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$1,190", savings: "$16k", type: "Standard" },
  { id: "stig-win10", framework: "DISA STIG", platform: "Windows", name: "DISA STIG — Microsoft Windows 10", version: "V3R6", blurb: "DoD STIG for Windows 10 endpoints, mapped to NIST 800-53. Public-domain source.", controls: 263, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$890", savings: "$15k", type: "Standard" },
  { id: "stig-rhel8", framework: "DISA STIG", platform: "Linux", name: "DISA STIG — Red Hat Enterprise Linux 8", version: "V2R8", blurb: "DoD STIG for RHEL 8, mapped to NIST 800-53. Public-domain source.", controls: 365, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$1,190", savings: "$18k", type: "Standard" },
  { id: "stig-mssql2016", framework: "DISA STIG", platform: "Databases", name: "DISA STIG — Microsoft SQL Server 2016 Instance", version: "V3R6", blurb: "DoD STIG for SQL Server 2016 database instances, mapped to NIST 800-53. Public-domain source.", controls: 84, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$890", savings: "$10k", type: "Standard" },
  { id: "stig-iis10", framework: "DISA STIG", platform: "Web", name: "DISA STIG — Microsoft IIS 10.0 Server", version: "V3R7", blurb: "DoD STIG for IIS 10.0 web servers, mapped to NIST 800-53. Public-domain source.", controls: 40, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$690", savings: "$7k", type: "Standard" },
  { id: "stig-apache24", framework: "DISA STIG", platform: "Web", name: "DISA STIG — Apache Server 2.4 (UNIX)", version: "V2R3", blurb: "DoD STIG for Apache HTTP Server 2.4 on UNIX, mapped to NIST 800-53. Public-domain source.", controls: 47, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$690", savings: "$7k", type: "Standard" },
  { id: "stig-docker", framework: "DISA STIG", platform: "Kubernetes", name: "DISA STIG — Docker Enterprise 2.x", version: "V2R1", blurb: "DoD STIG for Docker Enterprise 2.x on Linux/UNIX, mapped to NIST 800-53. Public-domain source.", controls: 100, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$890", savings: "$11k", type: "Standard" },
  { id: "stig-cisco-switch-ndm", framework: "DISA STIG", platform: "Network", name: "DISA STIG — Cisco IOS XE Switch (NDM)", version: "V3R4", blurb: "DoD STIG for Cisco IOS XE switch network-device management, mapped to NIST 800-53. Public-domain source.", controls: 42, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$790", savings: "$6k", type: "Standard" },
  { id: "stig-cisco-switch-l2s", framework: "DISA STIG", platform: "Network", name: "DISA STIG — Cisco IOS XE Switch (L2S)", version: "V3R2", blurb: "DoD STIG for Cisco IOS XE layer-2 switching, mapped to NIST 800-53. Public-domain source.", controls: 22, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$690", savings: "$5k", type: "Standard" },
  { id: "stig-vsphere8-esxi", framework: "DISA STIG", platform: "AWS", name: "DISA STIG — VMware vSphere 8.0 ESXi", version: "V2R4", blurb: "DoD STIG for VMware vSphere 8.0 ESXi hypervisor, mapped to NIST 800-53. Public-domain source.", controls: 66, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$890", savings: "$9k", type: "Standard" },
  { id: "stig-rhel7", framework: "DISA STIG", platform: "Linux", name: "DISA STIG — Red Hat Enterprise Linux 7", version: "V3R15", blurb: "DoD STIG for RHEL 7, mapped to NIST 800-53. Public-domain source.", controls: 244, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$990", savings: "$14k", type: "Standard" },
  { id: "stig-oracle19c", framework: "DISA STIG", platform: "Databases", name: "DISA STIG — Oracle Database 19c", version: "V1R5", blurb: "DoD STIG for Oracle Database 19c, mapped to NIST 800-53. Public-domain source.", controls: 83, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$890", savings: "$10k", type: "Standard" },
  { id: "stig-mongodb7", framework: "DISA STIG", platform: "Databases", name: "DISA STIG — MongoDB Enterprise Advanced 7.x", version: "V1R2", blurb: "DoD STIG for MongoDB Enterprise Advanced 7.x, mapped to NIST 800-53. Public-domain source.", controls: 51, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$790", savings: "$7k", type: "Standard" },
  { id: "stig-cisco-asa-ndm", framework: "DISA STIG", platform: "Network", name: "DISA STIG — Cisco ASA (NDM)", version: "V2R5", blurb: "DoD STIG for Cisco ASA network-device management, mapped to NIST 800-53. Public-domain source.", controls: 42, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$790", savings: "$6k", type: "Standard" },
  { id: "stig-cisco-nxos-ndm", framework: "DISA STIG", platform: "Network", name: "DISA STIG — Cisco NX-OS Switch (NDM)", version: "V2R3", blurb: "DoD STIG for Cisco NX-OS switch NDM, mapped to NIST 800-53. Public-domain source.", controls: 44, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$790", savings: "$6k", type: "Standard" },
  { id: "stig-paloalto-ndm", framework: "DISA STIG", platform: "Network", name: "DISA STIG — Palo Alto Networks (NDM)", version: "V3R4", blurb: "DoD STIG for Palo Alto Networks NDM, mapped to NIST 800-53. Public-domain source.", controls: 35, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$790", savings: "$6k", type: "Standard" },
  { id: "stig-f5-bigip-ndm", framework: "DISA STIG", platform: "Network", name: "DISA STIG — F5 BIG-IP Device Management", version: "V2R4", blurb: "DoD STIG for F5 BIG-IP device management, mapped to NIST 800-53. Public-domain source.", controls: 75, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$890", savings: "$9k", type: "Standard" },
  { id: "stig-vsphere8-vcenter", framework: "DISA STIG", platform: "AWS", name: "DISA STIG — VMware vSphere 8.0 vCenter", version: "V2R4", blurb: "DoD STIG for VMware vSphere 8.0 vCenter, mapped to NIST 800-53. Public-domain source.", controls: 67, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$890", savings: "$9k", type: "Standard" },
  { id: "stig-chrome", framework: "DISA STIG", platform: "M365", name: "DISA STIG — Google Chrome (Windows)", version: "V2R11", blurb: "DoD STIG for Google Chrome on Windows, mapped to NIST 800-53. Public-domain source.", controls: 46, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$690", savings: "$5k", type: "Standard" },
  { id: "stig-juniper-srx-ndm", framework: "DISA STIG", platform: "Network", name: "DISA STIG — Juniper SRX Services Gateway (NDM)", version: "V3R2", blurb: "DoD STIG for Juniper SRX network-device management, mapped to NIST 800-53. Public-domain source.", controls: 69, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$890", savings: "$9k", type: "Standard" },
  { id: "stig-juniper-srx-alg", framework: "DISA STIG", platform: "Network", name: "DISA STIG — Juniper SRX Services Gateway (ALG)", version: "V3R3", blurb: "DoD STIG for Juniper SRX application-layer gateway (firewall), mapped to NIST 800-53. Public-domain source.", controls: 24, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$690", savings: "$5k", type: "Standard" },
  { id: "stig-win2012r2", framework: "DISA STIG", platform: "Windows Server", name: "DISA STIG — Microsoft Windows Server 2012 / 2012 R2 (MS)", version: "V3R7", blurb: "DoD STIG for Windows Server 2012/2012 R2 member servers, mapped to NIST 800-53. Public-domain source.", controls: 318, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$1,190", savings: "$17k", type: "Standard" },
  { id: "stig-ubuntu2004", framework: "DISA STIG", platform: "Linux", name: "DISA STIG — Canonical Ubuntu 20.04 LTS", version: "V2R4", blurb: "DoD STIG for Ubuntu 20.04 LTS, mapped to NIST 800-53. Public-domain source.", controls: 171, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$890", savings: "$12k", type: "Standard" },
  { id: "stig-sles12", framework: "DISA STIG", platform: "Linux", name: "DISA STIG — SUSE Linux Enterprise Server 12", version: "V3R2", blurb: "DoD STIG for SLES 12, mapped to NIST 800-53. Public-domain source.", controls: 211, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$990", savings: "$13k", type: "Standard" },
  { id: "stig-solaris11", framework: "DISA STIG", platform: "Linux", name: "DISA STIG — Oracle Solaris 11 (SPARC)", version: "V3R6", blurb: "DoD STIG for Oracle Solaris 11 on SPARC, mapped to NIST 800-53. Public-domain source.", controls: 215, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$990", savings: "$13k", type: "Standard" },
  { id: "stig-aix7", framework: "DISA STIG", platform: "Linux", name: "DISA STIG — IBM AIX 7.x", version: "V3R3", blurb: "DoD STIG for IBM AIX 7.x, mapped to NIST 800-53. Public-domain source.", controls: 233, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$1,090", savings: "$14k", type: "Standard" },
  { id: "stig-postgresql9", framework: "DISA STIG", platform: "Databases", name: "DISA STIG — PostgreSQL 9.x", version: "V2R5", blurb: "DoD STIG for PostgreSQL 9.x, mapped to NIST 800-53. Public-domain source.", controls: 107, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$890", savings: "$11k", type: "Standard" },
  { id: "stig-oracle12c", framework: "DISA STIG", platform: "Databases", name: "DISA STIG — Oracle Database 12c", version: "V3R5", blurb: "DoD STIG for Oracle Database 12c, mapped to NIST 800-53. Public-domain source.", controls: 128, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$890", savings: "$12k", type: "Standard" },
  { id: "stig-tomcat9", framework: "DISA STIG", platform: "Web", name: "DISA STIG — Apache Tomcat 9", version: "V3R4", blurb: "DoD STIG for Apache Tomcat Application Server 9, mapped to NIST 800-53. Public-domain source.", controls: 77, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$690", savings: "$8k", type: "Standard" },
  { id: "stig-cisco-asa-vpn", framework: "DISA STIG", platform: "Network", name: "DISA STIG — Cisco ASA VPN", version: "V2R2", blurb: "DoD STIG for Cisco ASA VPN, mapped to NIST 800-53. Public-domain source.", controls: 40, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$690", savings: "$6k", type: "Standard" },
  { id: "stig-firefox", framework: "DISA STIG", platform: "M365", name: "DISA STIG — Mozilla Firefox", version: "V6R8", blurb: "DoD STIG for Mozilla Firefox, mapped to NIST 800-53. Public-domain source.", controls: 33, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$590", savings: "$4k", type: "Standard" },
  { id: "stig-edge", framework: "DISA STIG", platform: "M365", name: "DISA STIG — Microsoft Edge", version: "V2R5", blurb: "DoD STIG for Microsoft Edge, mapped to NIST 800-53. Public-domain source.", controls: 60, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$590", savings: "$5k", type: "Standard" },
  { id: "stig-adobe-acrobat", framework: "DISA STIG", platform: "M365", name: "DISA STIG — Adobe Acrobat Pro DC Continuous", version: "V1R2", blurb: "DoD STIG for Adobe Acrobat Pro DC (Continuous track), mapped to NIST 800-53. Public-domain source.", controls: 23, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$590", savings: "$3k", type: "Standard" },
  { id: "stig-vsphere8-photon", framework: "DISA STIG", platform: "AWS", name: "DISA STIG — VMware vSphere 8.0 Photon OS 4.0", version: "V2R2", blurb: "DoD STIG for the vCenter Appliance Photon OS 4.0, mapped to NIST 800-53. Public-domain source.", controls: 106, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$890", savings: "$11k", type: "Standard" },
  { id: "stig-macos15", framework: "DISA STIG", platform: "macOS", name: "DISA STIG — Apple macOS 15 (Sequoia)", version: "V1R7", blurb: "DoD Security Technical Implementation Guide for Apple macOS 15 (Sequoia), mapped to NIST 800-53. Public-domain source.", controls: 160, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$830", savings: "$6,400", type: "Standard" },
  { id: "stig-oracle-linux8", framework: "DISA STIG", platform: "Linux", name: "DISA STIG — Oracle Linux 8", version: "V2R9", blurb: "DoD Security Technical Implementation Guide for Oracle Linux 8, mapped to NIST 800-53. Public-domain source.", controls: 376, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$1,150", savings: "$15,040", type: "Standard" },
  { id: "stig-vsphere7-esxi", framework: "DISA STIG", platform: "Virtualization", name: "DISA STIG — VMware vSphere 7.0 ESXi", version: "V1R4", blurb: "DoD Security Technical Implementation Guide for VMware vSphere 7.0 ESXi, mapped to NIST 800-53. Public-domain source.", controls: 75, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$700", savings: "$3,000", type: "Standard" },
  { id: "stig-vsphere7-vcenter", framework: "DISA STIG", platform: "Virtualization", name: "DISA STIG — VMware vSphere 7.0 vCenter", version: "V1R3", blurb: "DoD Security Technical Implementation Guide for VMware vSphere 7.0 vCenter, mapped to NIST 800-53. Public-domain source.", controls: 57, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$680", savings: "$2,280", type: "Standard" },
  { id: "stig-ios18", framework: "DISA STIG", platform: "Mobile", name: "DISA STIG — Apple iOS/iPadOS 18", version: "V2R3", blurb: "DoD Security Technical Implementation Guide for Apple iOS/iPadOS 18, mapped to NIST 800-53. Public-domain source.", controls: 88, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$720", savings: "$3,520", type: "Standard" },
  { id: "stig-android15", framework: "DISA STIG", platform: "Mobile", name: "DISA STIG — Google Android 15 (COPE)", version: "V1R5", blurb: "DoD Security Technical Implementation Guide for Google Android 15 (COPE), mapped to NIST 800-53. Public-domain source.", controls: 45, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$660", savings: "$1,800", type: "Standard" },
  { id: "stig-sharepoint2013", framework: "DISA STIG", platform: "Application", name: "DISA STIG — Microsoft SharePoint 2013", version: "V1R9", blurb: "DoD Security Technical Implementation Guide for Microsoft SharePoint 2013, mapped to NIST 800-53. Public-domain source.", controls: 39, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$650", savings: "$1,560", type: "Standard" },
  { id: "stig-cisco-nxos-rtr", framework: "DISA STIG", platform: "Network", name: "DISA STIG — Cisco NX-OS Switch (RTR)", version: "V2R1", blurb: "DoD Security Technical Implementation Guide for Cisco NX-OS Switch (RTR), mapped to NIST 800-53. Public-domain source.", controls: 80, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$710", savings: "$3,200", type: "Standard" },
  { id: "stig-cisco-nxos-l2s", framework: "DISA STIG", platform: "Network", name: "DISA STIG — Cisco NX-OS Switch (L2S)", version: "V1R1", blurb: "DoD Security Technical Implementation Guide for Cisco NX-OS Switch (L2S), mapped to NIST 800-53. Public-domain source.", controls: 23, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$620", savings: "$920", type: "Standard" },
  { id: "stig-juniper-ex-ndm", framework: "DISA STIG", platform: "Network", name: "DISA STIG — Juniper EX Series Switch (NDM)", version: "V2R5", blurb: "DoD Security Technical Implementation Guide for Juniper EX Series Switch (NDM), mapped to NIST 800-53. Public-domain source.", controls: 55, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$670", savings: "$2,200", type: "Standard" },
  { id: "stig-bind9", framework: "DISA STIG", platform: "Network", name: "DISA STIG — ISC BIND 9.x DNS", version: "V3R3", blurb: "DoD Security Technical Implementation Guide for ISC BIND 9.x DNS, mapped to NIST 800-53. Public-domain source.", controls: 73, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$700", savings: "$2,920", type: "Standard" },
  { id: "stig-tanium7", framework: "DISA STIG", platform: "Application", name: "DISA STIG — Tanium 7.x", version: "V2R3", blurb: "DoD Security Technical Implementation Guide for Tanium 7.x, mapped to NIST 800-53. Public-domain source.", controls: 98, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$740", savings: "$3,920", type: "Standard" },
  { id: "stig-splunk8", framework: "DISA STIG", platform: "Application", name: "DISA STIG — Splunk Enterprise 8.x (Linux)", version: "V2R3", blurb: "DoD Security Technical Implementation Guide for Splunk Enterprise 8.x (Linux), mapped to NIST 800-53. Public-domain source.", controls: 37, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$650", savings: "$1,480", type: "Standard" },
  { id: "stig-mcafee-vse", framework: "DISA STIG", platform: "Application", name: "DISA STIG — McAfee VirusScan (Managed Client)", version: "V4R10", blurb: "DoD Security Technical Implementation Guide for McAfee VirusScan (Managed Client), mapped to NIST 800-53. Public-domain source.", controls: 61, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$680", savings: "$2,440", type: "Standard" },
  { id: "stig-ubuntu2404", framework: "DISA STIG", platform: "Linux", name: "DISA STIG — Canonical Ubuntu 24.04 LTS", version: "V1R6", blurb: "DoD Security Technical Implementation Guide for Canonical Ubuntu 24.04 LTS, mapped to NIST 800-53. Public-domain source.", controls: 194, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$880", savings: "$7,760", type: "Standard" },
  { id: "stig-openshift4", framework: "DISA STIG", platform: "Containers", name: "DISA STIG — Red Hat OpenShift Container Platform 4.x", version: "V2R6", blurb: "DoD Security Technical Implementation Guide for Red Hat OpenShift Container Platform 4.x, mapped to NIST 800-53. Public-domain source.", controls: 83, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$710", savings: "$3,320", type: "Standard" },
  { id: "stig-mysql8", framework: "DISA STIG", platform: "Database", name: "DISA STIG — Oracle MySQL 8.0", version: "V2R2", blurb: "DoD Security Technical Implementation Guide for Oracle MySQL 8.0, mapped to NIST 800-53. Public-domain source.", controls: 100, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$740", savings: "$4,000", type: "Standard" },
  { id: "stig-mariadb10", framework: "DISA STIG", platform: "Database", name: "DISA STIG — MariaDB Enterprise 10.x", version: "V2R5", blurb: "DoD Security Technical Implementation Guide for MariaDB Enterprise 10.x, mapped to NIST 800-53. Public-domain source.", controls: 84, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$720", savings: "$3,360", type: "Standard" },
  { id: "stig-nutanix-aos", framework: "DISA STIG", platform: "Virtualization", name: "DISA STIG — Nutanix AOS 5.20.x", version: "V1R1", blurb: "DoD Security Technical Implementation Guide for Nutanix AOS 5.20.x, mapped to NIST 800-53. Public-domain source.", controls: 111, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$760", savings: "$4,440", type: "Standard" },
  { id: "stig-zos-racf", framework: "DISA STIG", platform: "Mainframe", name: "DISA STIG — IBM z/OS (RACF)", version: "V9R9", blurb: "DoD Security Technical Implementation Guide for IBM z/OS (RACF), mapped to NIST 800-53. Public-domain source.", controls: 223, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$920", savings: "$8,920", type: "Standard" },
  { id: "stig-cisco-ios-ndm", framework: "DISA STIG", platform: "Network", name: "DISA STIG — Cisco IOS XE Router (NDM)", version: "V3R7", blurb: "DoD Security Technical Implementation Guide for Cisco IOS XE Router (NDM), mapped to NIST 800-53. Public-domain source.", controls: 42, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$650", savings: "$1,680", type: "Standard" },
  { id: "stig-aaa", framework: "DISA STIG", platform: "Network", name: "DISA STIG — AAA Services (SRG)", version: "V2R2", blurb: "DoD Security Technical Implementation Guide for AAA Services (SRG), mapped to NIST 800-53. Public-domain source.", controls: 76, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$700", savings: "$3,040", type: "Standard" },
  { id: "stig-cisco-switch-rtr", framework: "DISA STIG", platform: "Network", name: "DISA STIG — Cisco IOS XE Switch (RTR)", version: "V3R4", blurb: "DoD Security Technical Implementation Guide for Cisco IOS XE Switch (RTR), mapped to NIST 800-53. Public-domain source.", controls: 49, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$660", savings: "$1,960", type: "Standard" },
  { id: "stig-cisco-iosxr-rtr", framework: "DISA STIG", platform: "Network", name: "DISA STIG — Cisco IOS XR Router (RTR)", version: "V3R3", blurb: "DoD Security Technical Implementation Guide for Cisco IOS XR Router (RTR), mapped to NIST 800-53. Public-domain source.", controls: 94, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$730", savings: "$3,760", type: "Standard" },
  { id: "stig-cisco-iosxr-ndm", framework: "DISA STIG", platform: "Network", name: "DISA STIG — Cisco IOS XR Router (NDM)", version: "V3R6", blurb: "DoD Security Technical Implementation Guide for Cisco IOS XR Router (NDM), mapped to NIST 800-53. Public-domain source.", controls: 27, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$630", savings: "$1,080", type: "Standard" },
  { id: "stig-f5-bigip-ltm", framework: "DISA STIG", platform: "Network", name: "DISA STIG — F5 BIG-IP Local Traffic Manager", version: "V2R4", blurb: "DoD Security Technical Implementation Guide for F5 BIG-IP Local Traffic Manager, mapped to NIST 800-53. Public-domain source.", controls: 61, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$680", savings: "$2,440", type: "Standard" },
  { id: "stig-paloalto-alg", framework: "DISA STIG", platform: "Network", name: "DISA STIG — Palo Alto Networks (ALG)", version: "V3R4", blurb: "DoD Security Technical Implementation Guide for Palo Alto Networks (ALG), mapped to NIST 800-53. Public-domain source.", controls: 50, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$670", savings: "$2,000", type: "Standard" },
  { id: "stig-mongodb4", framework: "DISA STIG", platform: "Database", name: "DISA STIG — MongoDB Enterprise Advanced 4.x", version: "V1R4", blurb: "DoD Security Technical Implementation Guide for MongoDB Enterprise Advanced 4.x, mapped to NIST 800-53. Public-domain source.", controls: 51, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$670", savings: "$2,040", type: "Standard" },
  { id: "stig-apache24-win", framework: "DISA STIG", platform: "Web", name: "DISA STIG — Apache Server 2.4 (Windows)", version: "V3R4", blurb: "DoD Security Technical Implementation Guide for Apache Server 2.4 (Windows), mapped to NIST 800-53. Public-domain source.", controls: 49, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$660", savings: "$1,960", type: "Standard" },
  { id: "stig-iis10-site", framework: "DISA STIG", platform: "Web", name: "DISA STIG — Microsoft IIS 10.0 Site", version: "V2R16", blurb: "DoD Security Technical Implementation Guide for Microsoft IIS 10.0 Site, mapped to NIST 800-53. Public-domain source.", controls: 44, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$660", savings: "$1,760", type: "Standard" },
  { id: "stig-exchange2019-mbx", framework: "DISA STIG", platform: "Application", name: "DISA STIG — Microsoft Exchange 2019 Mailbox Server", version: "V2R3", blurb: "DoD Security Technical Implementation Guide for Microsoft Exchange 2019 Mailbox Server, mapped to NIST 800-53. Public-domain source.", controls: 66, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$690", savings: "$2,640", type: "Standard" },
  { id: "stig-office365", framework: "DISA STIG", platform: "Application", name: "DISA STIG — Microsoft Office 365 ProPlus", version: "V3R5", blurb: "DoD Security Technical Implementation Guide for Microsoft Office 365 ProPlus, mapped to NIST 800-53. Public-domain source.", controls: 129, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$780", savings: "$5,160", type: "Standard" },
  { id: "stig-dotnet4", framework: "DISA STIG", platform: "Application", name: "DISA STIG — .NET Framework 4.0", version: "V2R9", blurb: "DoD Security Technical Implementation Guide for .NET Framework 4.0, mapped to NIST 800-53. Public-domain source.", controls: 17, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$620", savings: "$680", type: "Standard" },
  { id: "stig-defender-av", framework: "DISA STIG", platform: "Application", name: "DISA STIG — Microsoft Defender Antivirus", version: "V2R9", blurb: "DoD Security Technical Implementation Guide for Microsoft Defender Antivirus, mapped to NIST 800-53. Public-domain source.", controls: 67, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$690", savings: "$2,680", type: "Standard" },
  { id: "stig-windows-firewall", framework: "DISA STIG", platform: "Application", name: "DISA STIG — Windows Defender Firewall", version: "V2R2", blurb: "DoD Security Technical Implementation Guide for Windows Defender Firewall, mapped to NIST 800-53. Public-domain source.", controls: 21, profiles: "CAT I–III", formats: "DOCX·PDF·XLSX", price: "$620", savings: "$840", type: "Standard" },
];

export const FAMILIES = [
  { id: "hardening", label: "Hardening Guides", desc: "Technical secure-configuration baselines by platform — CIS Benchmarks, DISA STIG, sold as platform packs." },
  { id: "standards", label: "Security Standards & Policies", desc: "Editable policies, procedures and compliance programs mapped to frameworks — sold as governance packs." },
];

// STIG products grouped into sellable packs. Prices/savings are computed from the real
// member products below, so packs stay accurate as the catalog grows.
export const STIG_GROUPS: Record<string, string[]> = {
  "Operating Systems": ["stig-rhel9", "stig-rhel8", "stig-rhel7", "stig-win2022", "stig-win2019", "stig-win2016", "stig-win2012r2", "stig-win11", "stig-win10", "stig-ubuntu2204", "stig-ubuntu2004", "stig-sles12", "stig-solaris11", "stig-aix7", "stig-macos14", "stig-macos15", "stig-oracle-linux8", "stig-ubuntu2404", "stig-zos-racf"],
  "Network & Firewall": ["stig-cisco-ios-rtr", "stig-cisco-switch-ndm", "stig-cisco-switch-l2s", "stig-cisco-asa-ndm", "stig-cisco-asa-vpn", "stig-cisco-nxos-ndm", "stig-paloalto-ndm", "stig-f5-bigip-ndm", "stig-juniper-srx-ndm", "stig-juniper-srx-alg", "stig-cisco-switch-rtr", "stig-cisco-iosxr-rtr", "stig-cisco-iosxr-ndm", "stig-f5-bigip-ltm", "stig-paloalto-alg", "stig-cisco-nxos-rtr", "stig-cisco-nxos-l2s", "stig-juniper-ex-ndm", "stig-bind9", "stig-cisco-ios-ndm", "stig-aaa"],
  Databases: ["stig-postgresql", "stig-postgresql9", "stig-mssql2016", "stig-oracle19c", "stig-oracle12c", "stig-mongodb7", "stig-mongodb4", "stig-mysql8", "stig-mariadb10"],
  "Containers & Virtualization": ["stig-k8s", "stig-docker", "stig-vsphere8-esxi", "stig-vsphere8-vcenter", "stig-vsphere8-photon", "stig-vsphere7-esxi", "stig-vsphere7-vcenter", "stig-openshift4", "stig-nutanix-aos"],
  "Web & Endpoint": ["stig-apache24", "stig-tomcat9", "stig-iis10", "stig-chrome", "stig-edge", "stig-firefox", "stig-adobe-acrobat", "stig-apache24-win", "stig-iis10-site", "stig-exchange2019-mbx", "stig-office365", "stig-dotnet4", "stig-defender-av", "stig-windows-firewall", "stig-ios18", "stig-android15", "stig-sharepoint2013", "stig-tanium7", "stig-splunk8", "stig-mcafee-vse"],
};

const _pn = (s: string) => Number(String(s).replace(/[^0-9.]/g, ""));
const _byId = (id: string) => PRODUCTS.find((p) => p.id === id);
function makePack(id: string, name: string, tagline: string, ids: string[], discountPct: number, featured = false): Bundle {
  const members = ids.map(_byId).filter(Boolean) as Product[];
  const sum = members.reduce((a, p) => a + _pn(p.price), 0);
  const price = Math.round((sum * (1 - discountPct / 100)) / 10) * 10;
  const savings = sum - price;
  return { id, family: "hardening", framework: "PACK", name, tagline, price: "$" + price.toLocaleString("en-US"), count: members.length, savings: "$" + savings.toLocaleString("en-US"), featured, includes: members.map((p) => p.name) };
}

export const BUNDLES: Bundle[] = [
  makePack("pk-stig-all", "Complete STIG Suite", "Every DISA STIG we publish — operating systems, network, databases, web, containers and virtualization.", Object.values(STIG_GROUPS).flat(), 30, true),
  makePack("pk-stig-os", "Operating Systems Pack", "RHEL 7/8/9, Windows 10/11 and Server 2016/2019/2022, Ubuntu 22.04 and macOS 14 baselines.", STIG_GROUPS["Operating Systems"], 20),
  makePack("pk-stig-net", "Network & Firewall Pack", "Cisco (Router, Switch, ASA, NX-OS), Palo Alto, F5 BIG-IP and Juniper SRX device baselines.", STIG_GROUPS["Network & Firewall"], 20),
  makePack("pk-stig-db", "Database Pack", "PostgreSQL, Microsoft SQL Server, Oracle Database and MongoDB baselines.", STIG_GROUPS["Databases"], 20),
  makePack("pk-stig-virt", "Containers & Virtualization Pack", "Kubernetes, Docker Enterprise and VMware vSphere 8 (ESXi + vCenter) baselines.", STIG_GROUPS["Containers & Virtualization"], 20),
  makePack("pk-stig-web", "Web & Endpoint Pack", "Apache HTTP Server, Microsoft IIS and Google Chrome baselines.", STIG_GROUPS["Web & Endpoint"], 20),
  // Editable standards/policies packs (roadmap — CIS/NIST/PCI content, sold once licensed).
  { id: "pk-std-all", family: "standards", framework: "PACK", name: "Complete Standards Suite", tagline: "Every editable policy, procedure and compliance program we publish.", price: "$7,900", count: 38, savings: "$70k", featured: true, includes: ["Governance Standards Pack", "NIST 800-53 Compliance Pack", "NIST 800-171 / CMMC Pack", "PCI DSS Compliance Pack", "All future additions for 12 months"] },
  { id: "pk-std-gov", family: "standards", framework: "PACK", name: "Governance Standards Pack", tagline: "Policies + procedures for SCF, NIST CSF 2.0 and ISO 27001/27002.", price: "$2,990", count: 14, savings: "$26k", includes: ["Policies & Standards — Secure Controls Framework", "Policies & Standards — NIST CSF 2.0", "Policies & Standards — ISO 27001/27002", "Matching editable procedures", "Cybersecurity Business Plan (CBP)"] },
  { id: "pk-std-nist", family: "standards", framework: "PACK", name: "NIST 800-53 Compliance Pack", tagline: "Moderate and high baselines with policies, procedures and SSP.", price: "$2,490", count: 9, savings: "$20k", includes: ["Policies & Standards — NIST 800-53 R5 (moderate)", "Policies & Standards — NIST 800-53 R5 (high)", "Matching editable procedures", "System Security Program (SSP)"] },
  { id: "pk-std-171", family: "standards", framework: "PACK", name: "NIST 800-171 / CMMC Pack", tagline: "Everything to stand up an 800-171 / CMMC compliance program.", price: "$1,890", count: 6, savings: "$14k", includes: ["NIST 800-171 Compliance Program (NCP)", "NIST 800-171 System Security Program (SSP)", "Plan of Action & Milestones (POA&M) template"] },
  { id: "pk-std-pci", family: "standards", framework: "PACK", name: "PCI DSS Compliance Pack", tagline: "Policies & standards for every PCI DSS v4 SAQ type.", price: "$2,290", count: 8, savings: "$16k", includes: ["PCI DSS v4 SAQ A / A-EP", "PCI DSS v4 SAQ B / B-IP", "PCI DSS v4 SAQ C / C-VT", "PCI DSS v4 SAQ D (Merchant & Service Provider)"] },
];

export const DIRECTORY: Record<string, { cat: string; items: string[] }[]> = {
  // Hardening directory is generated from the real STIG catalog groups.
  hardening: Object.entries(STIG_GROUPS).map(([cat, ids]) => ({
    cat,
    items: ids.map((id) => _byId(id)?.name.replace(/^DISA STIG — /, "") || id),
  })),
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

// Library shows every ingested DISA STIG product, derived from the catalog above.
export const LIBRARY_ITEMS = PRODUCTS.filter((p) => p.framework === "DISA STIG").map((p) => ({
  name: p.name,
  version: `${p.version} · ${p.controls} controls`,
  fw: "STIG",
  status: "Ready to scope",
  statusColor: "#1f7a4d",
  gens: "0 of 5 generations used",
  artifacts: [] as string[],
  configured: true,
  productId: p.id,
}));

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
