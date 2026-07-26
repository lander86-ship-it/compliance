import { NextResponse } from "next/server";
import { z } from "zod";
import { policyPreview, type GenInput } from "@/lib/generate";
import { getSessionUser } from "@/lib/auth";
import { entitlementsFor, entitlementsForRole, canGenerate } from "@/lib/entitlements";

export const runtime = "nodejs";

// Same shape as /api/generate, minus output formats — the preview is format-independent.
const schema = z.object({
  productId: z.string(),
  scope: z.object({
    legal: z.string(),
    trade: z.string().default(""),
    sector: z.string().default(""),
    owner: z.string().default(""),
    docv: z.string().default("1.0"),
    classification: z.string().default("Internal Use"),
    color: z.string().default("#0f4c9c"),
    env: z.string().default("On-premises"),
    profile: z.string().default("Level 1"),
    confidentiality: z.string().optional(),
  }),
  odp: z.record(z.string()).default({}),
  excluded: z.array(z.object({ controlId: z.string(), reason: z.string() })).default([]),
  included: z.array(z.string()).default([]),
  source: z.enum(["cis", "disa"]).optional(),
  guideRef: z.string().optional(),
  guideName: z.string().optional(),
  template: z
    .object({ base64: z.string().optional(), type: z.enum(["docx", "pdf"]), name: z.string().optional() })
    .optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.source) {
    const user = await getSessionUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Sign in to preview guides." }, { status: 401 });
    const ent = entitlementsForRole(user.role) || (await entitlementsFor(user.id));
    if (!canGenerate(ent, parsed.data.source, parsed.data.guideName)) {
      return NextResponse.json({ error: "Your plan does not include this source or category." }, { status: 403 });
    }
  }
  try {
    const input = { ...parsed.data, formats: [] } as unknown as GenInput;
    const preview = await policyPreview(input);
    return NextResponse.json(preview);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Preview failed" }, { status: 500 });
  }
}
