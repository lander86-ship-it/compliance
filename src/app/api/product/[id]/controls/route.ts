import { NextResponse } from "next/server";
import { isStigProduct, stigControlSummaries, STIG_PRODUCTS, loadStig } from "@/lib/hub/stig";
import { WINDOWS_CONTROLS } from "@/lib/hub/controlContent";

export const runtime = "nodejs";

// Control list for the Scope Wizard (id/title/family/severity), per product.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  if (isStigProduct(id)) {
    const p = STIG_PRODUCTS[id];
    const doc = loadStig(p.slug);
    const controls = stigControlSummaries(p.slug);
    return NextResponse.json({
      productId: id,
      name: p.name,
      benchmark: `${doc?.benchTitle || p.name} ${p.version}`,
      total: controls.length,
      controls,
    });
  }

  if (id === "cis-win2022") {
    return NextResponse.json({
      productId: id,
      name: "CIS Windows Server 2022 Benchmark",
      benchmark: "CIS Windows Server 2022 Benchmark v2.0.0",
      total: WINDOWS_CONTROLS.length,
      controls: WINDOWS_CONTROLS.map((c) => ({ id: c.id, title: c.title, family: c.family, severity: c.severity, cat: c.profile })),
    });
  }

  return NextResponse.json({ productId: id, name: id, benchmark: "", total: 0, controls: [] });
}
