import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { orgViewFor } from "@/lib/org";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only an org owner may manage members.
async function requireOwner() {
  const user = await getSessionUser().catch(() => null);
  if (!user) return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  const me = await prisma.user.findUnique({ where: { id: user.id } }).catch(() => null);
  if (!me?.orgId || me.orgRole !== "owner") return { error: NextResponse.json({ error: "Organization owner access required." }, { status: 403 }) };
  return { me, orgId: me.orgId };
}

const invite = z.object({ email: z.string().email() });

// Invite a member by email. If they already have an account (and no org), add them now;
// otherwise store a pending invite consumed when they next sign in.
export async function POST(req: Request) {
  const r = await requireOwner();
  if ("error" in r) return r.error;
  const parsed = invite.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  const email = parsed.data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } }).catch(() => null);
  if (existing) {
    if (existing.orgId === r.orgId) return NextResponse.json({ error: "That user is already in your organization." }, { status: 409 });
    if (existing.orgId) return NextResponse.json({ error: "That user already belongs to another organization." }, { status: 409 });
    await prisma.user.update({ where: { id: existing.id }, data: { orgId: r.orgId, orgRole: "member" } });
  } else {
    await prisma.orgInvite.upsert({
      where: { orgId_email: { orgId: r.orgId, email } },
      create: { orgId: r.orgId, email },
      update: {},
    });
  }
  return NextResponse.json({ ok: true, org: await orgViewFor(r.me.id) });
}

const remove = z.object({ userId: z.string().optional(), email: z.string().email().optional() });

// Remove a member (userId) or revoke a pending invite (email). The owner can't remove themselves.
export async function DELETE(req: Request) {
  const r = await requireOwner();
  if ("error" in r) return r.error;
  const parsed = remove.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (parsed.data.userId) {
    if (parsed.data.userId === r.me.id) return NextResponse.json({ error: "You can't remove yourself." }, { status: 400 });
    const target = await prisma.user.findUnique({ where: { id: parsed.data.userId } }).catch(() => null);
    if (target?.orgId === r.orgId) {
      await prisma.user.update({ where: { id: target.id }, data: { orgId: null, orgRole: null } });
    }
  } else if (parsed.data.email) {
    await prisma.orgInvite.deleteMany({ where: { orgId: r.orgId, email: parsed.data.email.toLowerCase() } });
  }
  return NextResponse.json({ ok: true, org: await orgViewFor(r.me.id) });
}
