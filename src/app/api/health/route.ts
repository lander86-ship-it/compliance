import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lightweight liveness probe for Railway's healthcheck. Returns 200 as soon as the
// server is accepting requests — deliberately does not touch the database or filesystem.
export function GET() {
  return NextResponse.json({ status: "ok", service: "securehub", time: new Date().toISOString() });
}
