import type { CSSProperties } from "react";

// Convert a CSS declaration string (as used verbatim in the design mockup) into a
// React style object. Lets us port the mockup's inline styles with high fidelity.
export function css(s: string): CSSProperties {
  const out: Record<string, string> = {};
  for (const decl of s.split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    const val = decl.slice(i + 1).trim();
    if (!prop || !val) continue;
    const camel = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[camel] = val;
  }
  return out as CSSProperties;
}

// Palette (ported from the design).
export const C = {
  bg: "#F7F7F5",
  panel: "#FBFAF9",
  soft: "#F1F2EA",
  border: "#E7E6E5",
  borderSoft: "#EFEEEC",
  ink: "#1C1917",
  muted: "#57534E",
  faint: "#79716B",
  primary: "#0f4c9c",
  link: "#1663d6",
  red: "#C9443A",
  redBright: "#E4544B",
  redDark: "#b4381f",
  green: "#1f7a4d",
  greenDark: "#186340",
  greenBg: "#e7f4ee",
  amber: "#b5721c",
  purple: "#6a2f6a",
} as const;

// Framework chip style — ported from mockup fwStyle().
export function fwStyle(fw: string): string {
  const map: Record<string, string> = {
    CIS: "#0f4c9c",
    "DISA STIG": "#6a2f6a",
    "NIST 800-53": "#1f6a4d",
    "NIST 800-171": "#1f6a4d",
    PACK: "#0f4c9c",
  };
  const c = map[fw] || "#57534E";
  return `display:inline-block;font-size:11px;font-weight:600;font-family:'Fragment Mono',monospace;color:${c};background:${c}14;border:1px solid ${c}33;padding:2px 8px;border-radius:5px;letter-spacing:.3px;`;
}

export function sevStyle(s: string): string {
  const c =
    ({ High: "#b4381f", Medium: "#b5721c", Low: "#57534E", "CAT I": "#b4381f" } as Record<string, string>)[s] ||
    "#57534E";
  return `font-size:10.5px;font-weight:600;color:${c};background:${c}14;padding:2px 7px;border-radius:20px;`;
}

export function profStyle(): string {
  return `font-size:10.5px;font-weight:600;color:#1663d6;background:#F1F2EA;padding:2px 7px;border-radius:20px;`;
}

export function statusPill(color: string): string {
  return `font-size:11px;font-weight:600;color:${color};background:${color}14;padding:3px 10px;border-radius:20px;`;
}
