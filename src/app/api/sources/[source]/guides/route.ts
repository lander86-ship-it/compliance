import { NextResponse } from "next/server";
import { connector } from "@/lib/sources";
import * as cisbench from "@/lib/sources/cisbench";
import type { SourceId } from "@/lib/hub/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Live search of a source's benchmark catalog (DISA public, or CIS via WorkBench).
export async function GET(req: Request, { params }: { params: { source: string } }) {
  const source = params.source as SourceId;
  if (source !== "cis" && source !== "disa") {
    return NextResponse.json({ error: "Unknown source" }, { status: 400 });
  }
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  // Diagnostic: raw cis-bench catalog output, to confirm field names.
  if (source === "cis" && url.searchParams.get("debug") === "cis-raw") {
    await cisbench.ensureAuth();
    return NextResponse.json({ raw: await cisbench.rawList().catch((e) => String(e)) });
  }
  try {
    const c = connector(source);
    const status = await c.status();
    if (!status.available) {
      return NextResponse.json({ source, available: false, detail: status.detail, guides: [] });
    }
    const guides = (await c.search(q)).slice(0, 200);
    return NextResponse.json({ source, available: true, detail: status.detail, count: guides.length, guides });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Search failed" }, { status: 502 });
  }
}
