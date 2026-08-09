// Merged catalog: the static bundle defaults with admin overrides applied and
// admin-created bundles appended. This is the single source of truth for the
// storefront, checkout and entitlements so edits in Admin › Catalog take effect.

import { prisma } from "./db";
import { BUNDLES, type Bundle, type SourceId } from "./hub/data";

const csv = (s: string | null | undefined): string[] => (s ? s.split(",").map((x) => x.trim()).filter(Boolean) : []);

export async function mergedBundles(): Promise<Bundle[]> {
  const overrides = await prisma.bundleOverride.findMany().catch(() => []);
  const byId = new Map(overrides.map((o) => [o.id, o]));

  // Static bundles with any override applied (skip ones deactivated by admin).
  const base: Bundle[] = BUNDLES.map((b) => {
    const o = byId.get(b.id);
    if (!o) return b;
    return {
      ...b,
      name: o.name ?? b.name,
      tagline: o.tagline ?? b.tagline,
      price: o.price ?? b.price,
      family: o.family ?? b.family,
      featured: o.featured ?? b.featured,
      sources: o.sourcesCsv != null ? (csv(o.sourcesCsv) as SourceId[]) : b.sources,
      categories: o.categoriesCsv != null ? csv(o.categoriesCsv) : b.categories,
    };
  }).filter((b) => byId.get(b.id)?.active !== false);

  // Admin-created custom bundles.
  const custom: Bundle[] = overrides
    .filter((o) => o.custom && o.active !== false)
    .map((o) => ({
      id: o.id,
      family: o.family || "hardening",
      framework: "PACK",
      name: o.name || o.id,
      tagline: o.tagline || "",
      price: o.price || "$0",
      count: csv(o.categoriesCsv).length,
      savings: "",
      featured: o.featured || false,
      includes: [],
      sources: csv(o.sourcesCsv) as SourceId[],
      categories: csv(o.categoriesCsv),
    }));

  return [...base, ...custom];
}

export async function bundleMapById(): Promise<Map<string, Bundle>> {
  return new Map((await mergedBundles()).map((b) => [b.id, b]));
}
