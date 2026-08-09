import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, isBackOffice, canManageCatalog, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BUNDLES } from "@/lib/hub/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_ROLES = new Set(["customer", "author", "admin", "owner"]);
const VALID_BUNDLES = new Set(BUNDLES.map((b) => b.id));

const schema = z.object({
  name: z.string().max(120).optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  newPassword: z.string().min(8).max(200).optional(),
  bundles: z.array(z.string()).optional(), // full desired set of granted bundles
});

// Admin user management: edit profile/role, reset password, grant/revoke access.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await getSessionUser().catch(() => null);
  if (!admin || !canManageCatalog(admin.role)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { name, email, role, newPassword, bundles } = parsed.data;
  const data: Record<string, unknown> = {};
  if (typeof name === "string") data.name = name.trim() || null;
  if (email && email.toLowerCase() !== target.email.toLowerCase()) {
    const taken = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (taken) return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
    data.email = email.toLowerCase();
  }
  if (role) {
    if (!VALID_ROLES.has(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    data.role = role;
  }
  if (newPassword) data.passwordHash = await hashPassword(newPassword);
  if (Object.keys(data).length) await prisma.user.update({ where: { id: target.id }, data });

  // Reconcile entitlements to exactly the desired set (grant new access / revoke removed).
  if (Array.isArray(bundles)) {
    const desired = new Set(bundles.filter((b) => VALID_BUNDLES.has(b)));
    const current = await prisma.entitlement.findMany({ where: { userId: target.id } });
    const currentIds = new Set(current.map((e) => e.bundleId));
    for (const b of desired) if (!currentIds.has(b)) await prisma.entitlement.create({ data: { userId: target.id, bundleId: b } }).catch(() => {});
    for (const e of current) if (!desired.has(e.bundleId)) await prisma.entitlement.delete({ where: { userId_bundleId: { userId: target.id, bundleId: e.bundleId } } }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

// Delete a user (and cascade their entitlements).
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getSessionUser().catch(() => null);
  if (!admin || !canManageCatalog(admin.role)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  if (admin.id === params.id) return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  await prisma.user.delete({ where: { id: params.id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
