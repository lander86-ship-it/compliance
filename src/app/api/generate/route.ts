import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { generateArtifacts, type GenInput } from "@/lib/generate";
import { getSessionUser } from "@/lib/auth";
import { entitlementsFor, entitlementsForRole, canGenerate } from "@/lib/entitlements";

export const runtime = "nodejs";

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
  formats: z.array(z.enum(["DOCX", "PDF", "XLSX", "POLICY"])).default(["DOCX", "PDF", "XLSX"]),
  // Live source selection (preferred over productId).
  source: z.enum(["cis", "disa"]).optional(),
  guideRef: z.string().optional(),
  guideName: z.string().optional(),
  // Optional customer house-style template (base64). ~15 MB cap on the decoded payload.
  template: z
    .object({
      base64: z.string().min(1).max(20_000_000),
      type: z.enum(["docx", "pdf"]),
      name: z.string().optional(),
    })
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

  // Entitlement enforcement for live-source generation (baked demo productId is open).
  const user = await getSessionUser().catch(() => null);
  if (parsed.data.source) {
    if (!user) return NextResponse.json({ error: "Sign in to generate guides." }, { status: 401 });
    const ent = entitlementsForRole(user.role) || (await entitlementsFor(user.id));
    if (!canGenerate(ent, parsed.data.source, parsed.data.guideName)) {
      return NextResponse.json({ error: "Your plan does not include this source or category. Purchase the matching bundle to generate it." }, { status: 403 });
    }
  }

  const jobId = crypto.randomUUID();
  try {
    const artifacts = await generateArtifacts(parsed.data as GenInput, jobId);

    // Best-effort persistence of the job + audit trail (does not block on DB availability).
    try {
      const { prisma } = await import("@/lib/db");
      const { audit } = await import("@/lib/audit");
      for (const a of artifacts) {
        await prisma.generationJob.create({
          data: { id: `${jobId}-${a.format}`, scopeProfileId: jobId, format: a.format, status: "done", artifactPath: a.fileName, hash: a.hash, finishedAt: new Date() },
        }).catch(() => {});
      }
      await audit(user?.email || "system", "generate", "GenerationJob", jobId, { productId: parsed.data.productId, formats: artifacts.map((a) => a.format) }).catch(() => {});
      await prisma.generationEvent.create({
        data: {
          userId: user?.id || null,
          userEmail: user?.email || null,
          source: parsed.data.source || "baked",
          guideRef: parsed.data.guideRef || null,
          guideName: parsed.data.guideName || parsed.data.productId || null,
          formats: artifacts.map((a) => a.format).join(","),
        },
      }).catch(() => {});
    } catch {
      /* DB not migrated — generation still succeeds */
    }

    return NextResponse.json({ jobId, artifacts });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Generation failed" }, { status: 500 });
  }
}
