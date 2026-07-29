import { NextResponse } from "next/server";
import { getSessionUser, isBackOffice, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { grantBundles, entitlementsFor } from "@/lib/entitlements";

export const runtime = "nodejs";

// Demo accounts (owner-only). The client is granted a full "fake" purchase so you can
// experience the buyer flow without paying; real new users pay via Stripe.
const DEMO = {
  admin: { email: "admin@demo.hardenhub.app", password: "Admin-2026-demo", name: "Demo Admin", role: "owner" },
  client: { email: "cliente@demo.hardenhub.app", password: "Cliente-2026-demo", name: "Demo Client", role: "customer", bundle: "pk-stig-all" },
};

export async function POST() {
  const me = await getSessionUser().catch(() => null);
  if (!me || !isBackOffice(me.role)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  try {
    // Admin demo user.
    await prisma.user.upsert({
      where: { email: DEMO.admin.email },
      update: { role: DEMO.admin.role, passwordHash: await hashPassword(DEMO.admin.password) },
      create: { email: DEMO.admin.email, name: DEMO.admin.name, role: DEMO.admin.role, passwordHash: await hashPassword(DEMO.admin.password) },
    });

    // Client demo user + a simulated ("fake") purchase of the all-access bundle.
    const client = await prisma.user.upsert({
      where: { email: DEMO.client.email },
      update: { role: DEMO.client.role, passwordHash: await hashPassword(DEMO.client.password) },
      create: { email: DEMO.client.email, name: DEMO.client.name, role: DEMO.client.role, passwordHash: await hashPassword(DEMO.client.password) },
    });
    await grantBundles(client.id, [DEMO.client.bundle]);
    const clientEntitlements = await entitlementsFor(client.id);

    return NextResponse.json({
      ok: true,
      accounts: [
        { role: "Admin", email: DEMO.admin.email, password: DEMO.admin.password },
        { role: "Client (fake purchase)", email: DEMO.client.email, password: DEMO.client.password, owns: clientEntitlements.bundleIds },
      ],
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Seed failed" }, { status: 500 });
  }
}
