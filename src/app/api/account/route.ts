import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().max(120).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(200).optional(),
  // Fiscal/billing profile (non-sensitive).
  taxId: z.string().max(60).optional(),
  billingName: z.string().max(200).optional(),
  billingAddress: z.string().max(400).optional(),
  country: z.string().max(2).optional(),
});

// Self-service profile update. Changing email or password requires the current password.
export async function PATCH(req: Request) {
  const sess = await getSessionUser().catch(() => null);
  if (!sess) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { name, email, currentPassword, newPassword, taxId, billingName, billingAddress, country } = parsed.data;

  const me = await prisma.user.findUnique({ where: { id: sess.id } });
  if (!me) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (typeof name === "string") data.name = name.trim() || null;
  if (typeof taxId === "string") data.taxId = taxId.trim() || null;
  if (typeof billingName === "string") data.billingName = billingName.trim() || null;
  if (typeof billingAddress === "string") data.billingAddress = billingAddress.trim() || null;
  if (typeof country === "string") data.country = country.trim().toUpperCase() || null;

  const sensitive = (email && email.toLowerCase() !== me.email.toLowerCase()) || newPassword;
  if (sensitive) {
    if (!currentPassword || !(await verifyPassword(currentPassword, me.passwordHash))) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
    }
  }
  if (email && email.toLowerCase() !== me.email.toLowerCase()) {
    const taken = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (taken) return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
    data.email = email.toLowerCase();
  }
  if (newPassword) data.passwordHash = await hashPassword(newPassword);

  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  const updated = await prisma.user.update({ where: { id: me.id }, data });
  return NextResponse.json({ ok: true, user: { id: updated.id, email: updated.email, role: updated.role, name: updated.name }, billing: { taxId: updated.taxId, billingName: updated.billingName, billingAddress: updated.billingAddress, country: updated.country } });
}

// Return the fiscal/billing profile for the account view.
export async function GET() {
  const sess = await getSessionUser().catch(() => null);
  if (!sess) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: sess.id } }).catch(() => null);
  if (!me) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  return NextResponse.json({ billing: { taxId: me.taxId, billingName: me.billingName, billingAddress: me.billingAddress, country: me.country } });
}
