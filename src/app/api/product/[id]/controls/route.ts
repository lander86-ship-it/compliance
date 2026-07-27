import { NextResponse } from "next/server";
import { WINDOWS_CONTROLS } from "@/lib/hub/controlContent";

export const runtime = "nodejs";

// Legacy demo control list (the live Generator fetches real controls per source on
// demand — no pre-bundled STIG data ships in the repo).
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
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
