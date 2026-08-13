import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { generateArtifacts, type GenInput } from "@/lib/generate";
import { getSessionUser } from "@/lib/auth";
import { clientIp } from "@/lib/rateLimit";
import { TRIAL_COOKIE, TRIAL_WINDOW_MS, trialUsed, markTrialUsed } from "@/lib/trial";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

const schema = z.object({
  kind: z.enum(["hardening", "standard"]).default("hardening"),
  legal: z.string().max(120).optional(),
});

// Report whether this visitor still has their free trial (for the UI on load).
export async function GET(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (user) return NextResponse.json({ used: false, signedIn: true });
  const ip = clientIp(req);
  const cookiePresent = req.headers.get("cookie")?.includes(`${TRIAL_COOKIE}=`) ?? false;
  return NextResponse.json({ used: trialUsed(ip, cookiePresent), signedIn: false });
}

// Guest trial: generate ONE sample document. Enforced server-side by IP + cookie so it
// can't be bypassed by clearing browser storage. Signed-in users are not limited.
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const user = await getSessionUser().catch(() => null);
  const isGuest = !user;

  // Enforce the one-per-visitor limit only for guests.
  if (isGuest) {
    const ip = clientIp(req);
    const cookiePresent = req.headers.get("cookie")?.includes(`${TRIAL_COOKIE}=`) ?? false;
    if (trialUsed(ip, cookiePresent)) {
      return NextResponse.json(
        { error: "You've already used your free trial. Create an account to generate more.", limited: true },
        { status: 429 },
      );
    }
  }

  // The trial always uses the open baked demo dataset (never a paid live source).
  const legal = (parsed.data.legal || "").trim() || "Your Company";
  const formats = parsed.data.kind === "standard" ? ["POLICY"] : ["DOCX", "PDF"];
  const input: GenInput = {
    productId: "cis-win2022",
    scope: {
      legal,
      trade: legal,
      sector: "",
      owner: `${legal} Security`,
      docv: "1.0",
      classification: "Trial sample",
      color: "#0f4c9c",
      env: "On-premises",
      profile: "Level 1",
    },
    odp: {},
    excluded: [],
    included: [],
    formats: formats as GenInput["formats"],
  } as GenInput;

  try {
    const artifacts = await generateArtifacts(input, crypto.randomUUID());
    const res = NextResponse.json({ artifacts });
    if (isGuest) {
      markTrialUsed(clientIp(req));
      res.cookies.set(TRIAL_COOKIE, "1", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: Math.floor(TRIAL_WINDOW_MS / 1000),
      });
    }
    return res;
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Generation failed" }, { status: 500 });
  }
}
