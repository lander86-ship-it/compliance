import { NextResponse } from "next/server";
import { mergedBundles } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public merged catalog (static defaults + admin edits + custom bundles).
export async function GET() {
  return NextResponse.json({ bundles: await mergedBundles() });
}
