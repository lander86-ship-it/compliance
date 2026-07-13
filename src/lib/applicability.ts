import { parseJson, parseStringArray } from "./serialize";

export type ApplicabilityRule = {
  platforms?: string[];
  profiles?: string[];
  environments?: string[];
};

export type ScopeSelection = {
  platforms: string[];
  profile: string; // "L1" | "L2"
  environment: string;
  included: string[]; // control ids explicitly kept
  excluded: { controlId: string; reason: string }[];
};

export type ResolvedControl<T> = {
  control: T;
  status: "included" | "excluded";
  reason?: string;
};

// A rule dimension matches if it's empty (applies to all) or intersects the scope selection.
function matches(ruleValues: string[] | undefined, selected: string[]): boolean {
  if (!ruleValues || ruleValues.length === 0) return true;
  return ruleValues.some((v) => selected.includes(v));
}

/**
 * Resolve which controls appear in the deliverable (generation engine, step 1 / FR-A-11).
 * Precedence:
 *   1. Explicit exclusion (with reason) always wins → status "excluded".
 *   2. Applicability rule must match the scope (platform ∧ profile ∧ environment).
 *   3. Explicit inclusion list, when non-empty, is an allow-list on top of the rule.
 */
export function resolveApplicability<T extends { id: string; applicabilityRule: string }>(
  productControls: T[],
  scope: ScopeSelection,
): ResolvedControl<T>[] {
  const excludedMap = new Map(scope.excluded.map((e) => [e.controlId, e.reason]));
  const hasIncludeList = scope.included.length > 0;

  const out: ResolvedControl<T>[] = [];
  for (const pc of productControls) {
    if (excludedMap.has(pc.id)) {
      out.push({ control: pc, status: "excluded", reason: excludedMap.get(pc.id) });
      continue;
    }
    const rule = parseJson<ApplicabilityRule>(pc.applicabilityRule, {});
    const ruleOk =
      matches(rule.platforms, scope.platforms) &&
      matches(rule.profiles, [scope.profile]) &&
      matches(rule.environments, [scope.environment]);
    if (!ruleOk) continue; // not applicable to this scope — omitted entirely

    if (hasIncludeList && !scope.included.includes(pc.id)) {
      out.push({ control: pc, status: "excluded", reason: "Not selected in scope" });
      continue;
    }
    out.push({ control: pc, status: "included" });
  }
  return out;
}

export function parseScopeArrays(raw: {
  platforms: string;
  included: string;
  excluded: string;
}): Pick<ScopeSelection, "platforms" | "included" | "excluded"> {
  return {
    platforms: parseStringArray(raw.platforms),
    included: parseStringArray(raw.included),
    excluded: parseJson<{ controlId: string; reason: string }[]>(raw.excluded, []),
  };
}
