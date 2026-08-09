// Entitlements: what a buyer may generate, derived from the bundles they own.
// A bundle grants its sources (CIS/DISA) and platform categories; the "Complete
// Hardening Access" bundle grants everything.

import { prisma } from "./db";
import { classifyGuide, type SourceId } from "./hub/data";
import { bundleMapById } from "./catalog";

export type Entitlements = { bundleIds: string[]; sources: SourceId[]; categories: string[]; all: boolean };

const ALL_ACCESS = "pk-stig-all";

export async function entitlementsFor(userId: string): Promise<Entitlements> {
  const rows = await prisma.entitlement.findMany({ where: { userId } }).catch(() => []);
  const bundleIds = rows.map((r) => r.bundleId);
  const bundleById = await bundleMapById();
  const sources = new Set<SourceId>();
  const categories = new Set<string>();
  for (const id of bundleIds) {
    const b = bundleById.get(id);
    if (!b) continue;
    (b.sources || []).forEach((s) => sources.add(s));
    (b.categories || []).forEach((c) => categories.add(c));
  }
  return { bundleIds, sources: [...sources], categories: [...categories], all: bundleIds.includes(ALL_ACCESS) };
}

// Admins/owners can generate anything.
export function entitlementsForRole(role: string | null | undefined): Entitlements | null {
  if (role === "admin" || role === "owner") return { bundleIds: ["*"], sources: ["cis", "disa"], categories: [], all: true };
  return null;
}

export function canGenerate(ent: Entitlements, source: SourceId, guideName?: string): boolean {
  if (ent.all) return true;
  if (!ent.sources.includes(source)) return false;
  if (!guideName) return true;
  const cat = classifyGuide(guideName);
  // Unclassifiable guides ("Other") aren't blocked on a classifier gap; the source gate still applies.
  return cat === "Other" || ent.categories.includes(cat);
}

export async function grantBundles(userId: string, bundleIds: string[]): Promise<void> {
  const bundleById = await bundleMapById();
  const valid = bundleIds.filter((id) => bundleById.has(id));
  for (const bundleId of valid) {
    await prisma.entitlement
      .upsert({ where: { userId_bundleId: { userId, bundleId } }, create: { userId, bundleId }, update: {} })
      .catch(() => {});
  }
}
