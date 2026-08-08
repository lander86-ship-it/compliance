// Parse a CIS benchmark XCCDF export (from `cis-bench export <id> --format xccdf`) into
// the engine's FullControl shape. Ported from the /cis service's app/cis_parse.py:
// <Group> = section, <Rule> = control; title / rationale / fixtext / check-content are
// read by local element name (namespace-agnostic).

import { XMLParser } from "fast-xml-parser";
import type { FullControl } from "../hub/controlContent";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  removeNSPrefix: true,
  textNodeName: "#text",
  trimValues: true,
});

type Node = Record<string, unknown>;

function asArray(v: unknown): unknown[] {
  return v == null ? [] : Array.isArray(v) ? v : [v];
}

// Flatten any node to its visible text, stripping markup/whitespace (CIS text is Markdown+HTML).
function text(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string") return clean(node);
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join(" ").trim();
  if (typeof node === "object") {
    const o = node as Node;
    const parts: string[] = [];
    if (o["#text"] != null) parts.push(String(o["#text"]));
    for (const [k, v] of Object.entries(o)) {
      if (k.startsWith("@") || k === "#text") continue;
      parts.push(text(v));
    }
    return clean(parts.join(" "));
  }
  return "";
}

function clean(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function firstText(node: Node, name: string): string {
  return text(node[name]);
}

function levelFrom(...texts: string[]): string {
  const t = texts.join(" ").toLowerCase();
  if (/level 2|\bl2\b|\(l2\)/.test(t)) return "L2";
  if (/level 1|\bl1\b|\(l1\)/.test(t)) return "L1";
  return "L1";
}

const SEV: Record<string, string> = { high: "High", medium: "Medium", low: "Low", unknown: "Medium" };

function ruleToControl(rule: Node, section: string): FullControl {
  const title = firstText(rule, "title");
  const idAttr = String(rule["@id"] || "");
  const numFromTitle = title.match(/^(\d+(?:\.\d+)+)\b/)?.[1];
  const numFromId = idAttr.match(/(\d+(?:[._]\d+)+)/)?.[1]?.replace(/_/g, ".");
  const id = numFromTitle || numFromId || idAttr || "—";
  const rationale = firstText(rule, "rationale") || firstText(rule, "description");
  const remediation = firstText(rule, "fixtext") || firstText(rule, "fix");
  // check → check-content (audit procedure)
  const check = asArray(rule["check"])[0] as Node | undefined;
  const audit = check ? firstText(check, "check-content") || text(check) : "";
  const sev = String(rule["@severity"] || "unknown").toLowerCase();
  const profile = levelFrom(title, idAttr);
  return {
    id,
    family: section || "General",
    title: title.replace(/^(\d+(?:\.\d+)+)\s*/, "") || id,
    severity: SEV[sev] || "Medium",
    profile,
    rationale,
    audit,
    remediation,
    nist: "—",
    csf: "—",
    iso: "—",
  };
}

export type ParsedBenchmark = { benchTitle: string; version: string; controls: FullControl[] };

export function parseXccdf(data: Buffer | string): ParsedBenchmark {
  const doc = parser.parse(typeof data === "string" ? data : data.toString("utf8")) as Node;
  const bench = (doc["Benchmark"] || doc["benchmark"]) as Node | undefined;
  if (!bench) return { benchTitle: "CIS Benchmark", version: "", controls: [] };

  const benchTitle = firstText(bench, "title") || "CIS Benchmark";
  const version = firstText(bench, "version") || firstText(bench, "status") || "";
  const controls: FullControl[] = [];

  const walk = (group: Node, inherited: string) => {
    const gtitle = firstText(group, "title");
    const current = gtitle && gtitle.length > 1 ? gtitle : inherited;
    for (const rule of asArray(group["Rule"])) controls.push(ruleToControl(rule as Node, current));
    for (const sub of asArray(group["Group"])) walk(sub as Node, current);
  };

  for (const g of asArray(bench["Group"])) walk(g as Node, "");
  for (const r of asArray(bench["Rule"])) controls.push(ruleToControl(r as Node, ""));

  return { benchTitle, version, controls };
}
