// Seed the ControlForge/HardenHub database with a demo catalog grounded in the FRD data model.
// Content licensing (§11): CIS-derived products are marked MAP_ONLY and carry ORIGINAL text that
// maps to the benchmark; NIST / DISA STIG are public-domain (VERBATIM_OK).

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { WINDOWS_CONTROLS, ODP_TOKENS } from "../src/lib/hub/controlContent";
import { PRODUCTS } from "../src/lib/hub/data";

type StigJson = {
  slug: string;
  benchTitle: string;
  release: string;
  controls: { code: string; vulnId: string; ruleId: string; title: string; severity: string; cat: string; srg: string; rationale: string; audit: string; remediation: string; ccis: string[]; nist: string[] }[];
};
function stigFamily(code: string): string {
  const m = code.match(/^([A-Z0-9]+-[A-Z0-9]{2})/i);
  return m ? m[1].toUpperCase() : "General";
}

const prisma = new PrismaClient();

async function main() {
  // Reset (dev only) — order matters for FKs.
  await prisma.auditLog.deleteMany();
  await prisma.generationJob.deleteMany();
  await prisma.mapping.deleteMany();
  await prisma.customField.deleteMany();
  await prisma.productControl.deleteMany();
  await prisma.control.deleteMany();
  await prisma.controlFamily.deleteMany();
  await prisma.sourceDocument.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.product.deleteMany();
  await prisma.framework.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Frameworks with reproduction policy (drives what may be reproduced verbatim vs. mapped).
  const frameworks = await Promise.all([
    prisma.framework.create({ data: { id: "fw-cis", name: "CIS", owner: "Center for Internet Security", version: "various", license: "CIS SecureSuite", reproductionMode: "MAP_ONLY", sourceUrl: "https://www.cisecurity.org/cis-benchmarks" } }),
    prisma.framework.create({ data: { id: "fw-stig", name: "DISA STIG", owner: "DISA (DoD)", version: "various", license: "Public Domain", reproductionMode: "VERBATIM_OK", sourceUrl: "https://public.cyber.mil/stigs/" } }),
    prisma.framework.create({ data: { id: "fw-nist53", name: "NIST 800-53", owner: "NIST", version: "Rev 5", license: "Public Domain", reproductionMode: "VERBATIM_OK", sourceUrl: "https://csrc.nist.gov" } }),
    prisma.framework.create({ data: { id: "fw-iso", name: "ISO 27002", owner: "ISO", version: "2022", license: "ISO Copyright", reproductionMode: "MAP_ONLY" } }),
    prisma.framework.create({ data: { id: "fw-pci", name: "PCI DSS", owner: "PCI SSC", version: "v4", license: "PCI SSC Copyright", reproductionMode: "MAP_ONLY" } }),
  ]);
  void frameworks;

  // Source document + families for the Windows benchmark.
  const src = await prisma.sourceDocument.create({ data: { frameworkId: "fw-cis", format: "XCCDF", version: "v2.0.0", fileName: "CIS_Windows_Server_2022_v2.0.0.xml" } });
  const familyNames = Array.from(new Set(WINDOWS_CONTROLS.map((c) => c.family)));
  const familyMap = new Map<string, string>();
  for (const name of familyNames) {
    const f = await prisma.controlFamily.create({ data: { frameworkId: "fw-cis", code: name.split(" ").map((w) => w[0]).join("").toUpperCase(), name } });
    familyMap.set(name, f.id);
  }

  // Controls + cross-mappings + a customization field (ODP) where applicable.
  for (const c of WINDOWS_CONTROLS) {
    const control = await prisma.control.create({
      data: {
        frameworkId: "fw-cis", sourceDocumentId: src.id, familyId: familyMap.get(c.family),
        code: c.id, title: c.title, rationale: c.rationale, audit: c.audit, remediation: c.remediation,
        severity: c.severity.toLowerCase(), profile: c.profile, references: JSON.stringify([`CIS §${c.id}`]),
      },
    });
    await prisma.mapping.createMany({
      data: [
        { controlId: control.id, targetFramework: "NIST 800-53", targetControlCode: c.nist },
        { controlId: control.id, targetFramework: "NIST CSF", targetControlCode: c.csf },
        { controlId: control.id, targetFramework: "ISO 27002", targetControlCode: c.iso },
      ],
    });
    // Attach ODP fields to controls whose remediation references a token.
    for (const [odpKey, token] of Object.entries(ODP_TOKENS)) {
      if (c.remediation.includes(`{{${token}}}`)) {
        const defaults: Record<string, string> = { pwlen: "14", lockout: "5", logret: "365", sessions: "15" };
        await prisma.customField.create({ data: { controlId: control.id, name: odpKey, label: token.replace(/_/g, " "), type: "number", defaultValue: defaults[odpKey], help: `Organization-defined value for ${token}` } });
      }
    }
  }

  // Products (catalog) — link the Windows product to its controls.
  const fwTagToId: Record<string, string> = { CIS: "fw-cis", "DISA STIG": "fw-stig", "NIST 800-53": "fw-nist53" };
  for (const p of PRODUCTS) {
    const priceCents = Number(p.price.replace(/[^0-9]/g, "")) * 100;
    const savingsCents = Number(p.savings.replace(/[^0-9]/g, "")) * 1000 * 100; // "$18k" → 18,000
    const created = await prisma.product.create({
      data: {
        slug: p.id, name: p.name, platform: p.platform, type: p.type.toLowerCase().includes("standard") ? "standard" : "hardening_guide",
        frameworkTag: p.framework, benchmarkVersion: p.version, profiles: JSON.stringify(p.profiles.split(" · ")),
        formats: JSON.stringify(["DOCX", "PDF", "XLSX"]), description: p.blurb, priceCents, currency: "USD",
        estimatedSavingsCents: savingsCents, status: "published", maxGenerations: 5,
      },
    });
    void fwTagToId;
    if (p.id === "cis-win2022") {
      const controls = await prisma.control.findMany({ where: { frameworkId: "fw-cis" } });
      let order = 0;
      for (const c of controls) {
        const profiles = c.profile === "L2" ? ["Level 2"] : ["Level 1", "Level 2"];
        await prisma.productControl.create({ data: { productId: created.id, controlId: c.id, order: order++, applicabilityRule: JSON.stringify({ profiles }) } });
      }
    }
  }

  // Coupon + demo org/user.
  await prisma.coupon.create({ data: { code: "HARDEN25", type: "percent", value: 25, active: true } });
  const org = await prisma.organization.create({ data: { legalName: "Northwind Financial Group", tradeName: "Northwind", sector: "Financial services", taxId: "ESB12345678", country: "ES" } });
  await prisma.user.create({ data: { orgId: org.id, email: "m.torres@northwind.example", passwordHash: "seeded-no-login", name: "M. Torres", role: "customer", mfaEnabled: true } });
  await prisma.user.create({ data: { email: "admin@hardenhub.example", passwordHash: "seeded-no-login", name: "HardenHub Admin", role: "owner", mfaEnabled: true } });

  const counts = { frameworks: frameworks.length, cisDemoControls: WINDOWS_CONTROLS.length, products: PRODUCTS.length };
  console.log("Seed complete:", JSON.stringify(counts));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
