import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { orgViewFor } from "@/lib/org";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Current user's organization (null if they have none).
export async function GET() {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const org = await orgViewFor(user.id).catch(() => null);
  return NextResponse.json({ org });
}

const create = z.object({
  legalName: z.string().min(1).max(200),
  tradeName: z.string().max(200).optional(),
  taxId: z.string().max(60).optional(),
  country: z.string().max(2).optional(),
});

// Create an organization and make the current user its owner. A user already in an org can't.
export async function POST(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: user.id } }).catch(() => null);
  if (!me) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  if (me.orgId) return NextResponse.json({ error: "You already belong to an organization." }, { status: 409 });

  const parsed = create.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter your organization's legal name." }, { status: 400 });
  const v = parsed.data;
  try {
    const org = await prisma.organization.create({
      data: { legalName: v.legalName.trim(), tradeName: v.tradeName?.trim() || null, taxId: v.taxId?.trim() || null, country: v.country?.trim().toUpperCase() || null },
    });
    await prisma.user.update({ where: { id: me.id }, data: { orgId: org.id, orgRole: "owner" } });
    return NextResponse.json({ ok: true, org: await orgViewFor(me.id) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not create organization" }, { status: 500 });
  }
}
