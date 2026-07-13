import { prisma } from "./db";
import { toJson } from "./serialize";

// Append-only audit log — FR-A-35 / NFR-S-06. We only ever create rows here; never update/delete.
export async function audit(
  actor: string,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await prisma.auditLog.create({
    data: { actor, action, entity, entityId: entityId ?? null, metadata: toJson(metadata ?? {}) },
  });
}
