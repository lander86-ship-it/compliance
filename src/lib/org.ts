// Organization (team account) helpers.
import { prisma } from "./db";

// When a user authenticates, auto-join any organization that invited their email
// (only if they aren't already in an org). Returns the joined orgId, if any.
export async function consumeInvites(userId: string, email: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { orgId: true } });
    if (!user || user.orgId) return null;
    const invite = await prisma.orgInvite.findFirst({ where: { email: email.toLowerCase() }, orderBy: { createdAt: "asc" } });
    if (!invite) return null;
    await prisma.user.update({ where: { id: userId }, data: { orgId: invite.orgId, orgRole: "member" } });
    await prisma.orgInvite.deleteMany({ where: { email: email.toLowerCase() } });
    return invite.orgId;
  } catch {
    return null; // org tables not migrated yet — personal account still works
  }
}

export type OrgView = {
  id: string;
  legalName: string;
  tradeName: string | null;
  taxId: string | null;
  country: string | null;
  role: string; // the requesting user's org role
  members: { id: string; email: string; name: string | null; orgRole: string | null }[];
  invites: { email: string }[];
};

export async function orgViewFor(userId: string): Promise<OrgView | null> {
  const me = await prisma.user.findUnique({ where: { id: userId } }).catch(() => null);
  if (!me?.orgId) return null;
  const org = await prisma.organization.findUnique({ where: { id: me.orgId } }).catch(() => null);
  if (!org) return null;
  const members = await prisma.user.findMany({ where: { orgId: org.id }, select: { id: true, email: true, name: true, orgRole: true }, orderBy: { createdAt: "asc" } }).catch(() => []);
  const invites = await prisma.orgInvite.findMany({ where: { orgId: org.id }, select: { email: true } }).catch(() => []);
  return {
    id: org.id,
    legalName: org.legalName,
    tradeName: org.tradeName,
    taxId: org.taxId,
    country: org.country,
    role: me.orgRole || "member",
    members,
    invites,
  };
}
