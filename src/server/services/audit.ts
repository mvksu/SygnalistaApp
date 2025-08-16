import { db } from "@/db"
import { auditLog } from "@/db/schema/audit"

export async function writeAudit(options: {
  orgId: string
  actorId?: string | null
  action: string
  targetType: string
  targetId: string
  ipHash?: string | null
  uaHash?: string | null
}) {
  await db.insert(auditLog).values({
    orgId: options.orgId,
    actorId: options.actorId || null,
    action: options.action,
    targetType: options.targetType,
    targetId: options.targetId,
    ipHash: options.ipHash || null,
    uaHash: options.uaHash || null,
  })
}



