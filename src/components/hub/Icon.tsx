import React from "react";

// Icon set ported from the mockup (navIcon / hero icons). Stroke-based, 24x24 viewBox.
const PATHS: Record<string, (string | { c: [number, number, number] })[]> = {
  Catalog: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M14 14h7v7h-7z", "M3 14h7v7H3z"],
  Bundles: ["M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z", "m3.3 7 8.7 5 8.7-5", "M12 22V12"],
  Frameworks: ["M6 3v12", { c: [18, 6, 3] }, { c: [6, 18, 3] }, "M18 9a9 9 0 0 1-9 9"],
  "Free guides": ["M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z", "M14 2v4a2 2 0 0 0 2 2h4", "M16 13H8", "M16 17H8", "M10 9H8"],
  Cart: [{ c: [8, 21, 1] }, { c: [19, 21, 1] }, "M2 2h2l2.6 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H5.1"],
  Library: ["m16 6 4 14", "M12 6v14", "M8 8v12", "M4 4v16"],
  Licenses: ["M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z", "m9 12 2 2 4-4"],
  Subscriptions: ["M3 2v6h6", "M21 12A9 9 0 0 0 6 5.3L3 8", "M21 22v-6h-6", "M3 12a9 9 0 0 0 15 6.7l3-2.7"],
  Invoices: ["M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z", "M16 8H8", "M16 12H8", "M12 16H8"],
  Account: ["M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", { c: [12, 7, 4] }],
  Dashboard: ["M3 3h7v9H3z", "M14 3h7v5h-7z", "M14 12h7v9h-7z", "M3 16h7v5H3z"],
  "AI Generator": ["M9.94 14.66A4 4 0 1 1 14 10.3", "m14 7 3 3", "M5 6v4", "M19 14v4", "M10 2v2", "M7 8H3", "M21 16h-4", "M11 3H9"],
  "Control editor": ["M4 21v-7", "M4 10V3", "M12 21v-9", "M12 8V3", "M20 21v-5", "M20 12V3", "M2 14h4", "M10 8h4", "M18 16h4"],
  "Catalog & pricing": ["M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z", { c: [7.5, 7.5, 0.5] }],
  Orders: ["M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z", "M3 6h18", "M16 10a4 4 0 0 1-8 0"],
  Versioning: [{ c: [12, 12, 3] }, "M3 12h6", "M15 12h6"],
  "Audit log": ["M8 6h13", "M8 12h13", "M8 18h13", "M3 6h.01", "M3 12h.01", "M3 18h.01"],
  shield: ["M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z", "m9 12 2 2 4-4"],
  map: ["M6 3v12", { c: [18, 6, 3] }, { c: [6, 18, 3] }, "M18 9a9 9 0 0 1-9 9"],
  sliders: ["M4 21v-7", "M4 10V3", "M12 21v-9", "M12 8V3", "M20 21v-5", "M20 12V3", "M2 14h4", "M10 8h4", "M18 16h4"],
  fileDown: ["M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z", "M14 2v4a2 2 0 0 0 2 2h4", "M12 18v-6", "m9 15 3 3 3-3"],
};

export function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const paths = PATHS[name] || ["M12 8v.01", "M12 12v4"];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {paths.map((p, i) =>
        typeof p === "string" ? (
          <path key={i} d={p} />
        ) : (
          <circle key={i} cx={p.c[0]} cy={p.c[1]} r={p.c[2]} />
        ),
      )}
    </svg>
  );
}
