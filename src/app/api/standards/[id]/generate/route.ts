import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { entitlementsFor, entitlementsForRole, ownsStandard } from "@/lib/entitlements";
import { parseContent, buildStandardDocx, buildStandardPdf, standardBlocks, standardInlineMap, type StandardScope } from "@/lib/standardDoc";
import { injectBlocksIntoDocx, injectBlocksIntoPdf } from "@/lib/policyTemplate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  legal: z.string().min(1).max(200),
  version: z.string().max(20).optional(),
  classification: z.string().max(60).optional(),
  template: z
    .object({ base64: z.string().min(1).max(20_000_000), type: z.enum(["docx", "pdf"]), name: z.string().optional() })
    .optional(),
});

const BRAND = "#0f4c9c";

// A buyer generates their own copy of a purchased standard: rendered with their company
// name (+ house-style template if supplied) and stored in their Library, deduped per standard.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in to generate." }, { status: 401 });

  const std = await prisma.standard.findUnique({ where: { id: params.id } }).catch(() => null);
  if (!std || std.status !== "published") return NextResponse.json({ error: "Standard not available." }, { status: 404 });

  const ent = entitlementsForRole(user.role) || (await entitlementsFor(user.id));
  if (!ownsStandard(ent, std.bundleId)) {
    return NextResponse.json({ error: "Purchase the matching bundle to generate this standard." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter your organization's legal name." }, { status: 400 });

  // Fall back to the buyer's saved default template when none supplied.
  let template = parsed.data.template;
  if (!template) {
    const saved = await prisma.userTemplate.findUnique({ where: { userId: user.id } }).catch(() => null);
    if (saved) template = { base64: saved.data, type: saved.type as "docx" | "pdf", name: saved.name };
  }

  const content = parseContent(std.contentJson);
  const scope: StandardScope = { org: parsed.data.legal, version: parsed.data.version || "1.0", classification: parsed.data.classification || "Internal Use" };

  let docx: string | null = null;
  let pdf: string | null = null;
  if (std.masterDocx) {
    // Ready-made master document: personalize the authoritative DOCX with the buyer's organization.
    try {
      const { personalizeMasterDocx, masterFields } = await import("@/lib/masterDoc");
      docx = (await personalizeMasterDocx(std.masterDocx, masterFields(parsed.data.legal))).toString("base64");
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Generation failed" }, { status: 500 });
    }
  } else try {
    const blocks = standardBlocks(std.title, content, scope);
    if (template?.type === "docx") {
      const buf = Buffer.from(template.base64, "base64");
      docx = (await injectBlocksIntoDocx(buf, standardInlineMap(std.title, scope), blocks, BRAND)).toString("base64");
    } else {
      docx = (await buildStandardDocx(std.title, content, scope)).toString("base64");
    }
    if (template?.type === "pdf") {
      const buf = Buffer.from(template.base64, "base64");
      pdf = (await injectBlocksIntoPdf(buf, blocks, BRAND)).toString("base64");
    } else {
      pdf = (await buildStandardPdf(std.title, content, scope)).toString("base64");
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Generation failed" }, { status: 500 });
  }

  const guideKey = `standard:${std.id}`;
  const nextReview = new Date(Date.now() + 365 * 24 * 3600 * 1000);
  try {
    const existing = await prisma.generatedDoc.findUnique({ where: { userId_guideKey: { userId: user.id, guideKey } } });
    if (existing) {
      await prisma.generatedDoc.update({
        where: { id: existing.id },
        data: { source: "policy", guideName: std.title, legal: parsed.data.legal, docx, pdf, version: existing.version + 1, createdAt: new Date(), reviewedAt: null, nextReviewAt: nextReview },
      });
    } else {
      await prisma.generatedDoc.create({
        data: { userId: user.id, guideKey, source: "policy", guideName: std.title, legal: parsed.data.legal, docx, pdf, nextReviewAt: nextReview },
      });
    }
    await prisma.generationEvent.create({
      data: { userId: user.id, userEmail: user.email, source: "policy", guideRef: std.id, guideName: std.title, formats: "DOCX,PDF", artifacts: "" },
    }).catch(() => {});
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not save to your library." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, guideName: std.title });
}
