import { NextResponse } from "next/server";
import { getSessionUser, refreshSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns the current user and slides the 10-minute session forward. The client
// pings this on activity (and on an interval) so an active user stays logged in.
export async function GET() {
  const user = await getSessionUser().catch(() => null);
  const res = NextResponse.json({ user });
  if (user) refreshSession(res, user.id);
  return res;
}
