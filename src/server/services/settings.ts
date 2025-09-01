import { db } from "@/db"
import { organizations } from "@/db/schema/organizations"
import { reportCategories } from "@/db/schema/reportCategories"
import { eq } from "drizzle-orm"
import { writeAudit } from "@/src/server/services/audit"

export async function getOrgSettings(orgId: string) {
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) })
  return org
}

export async function updateOrgSettings(orgId: string, input: { name?: string; locale?: string; retentionDays?: number; anonymousAllowed?: boolean; ackDays?: number; feedbackMonths?: number; slaEnabled?: boolean; actorId?: string | null; ipHash?: string | null; uaHash?: string | null }) {
  // Get current organization settings to detect changes
  const currentOrg = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) })
  
  await db.update(organizations).set({
    name: input.name,
    locale: input.locale,
    retentionDays: input.retentionDays as any,
    anonymousAllowed: input.anonymousAllowed,
    ackDays: input.ackDays as any,
    feedbackMonths: input.feedbackMonths as any,
    slaEnabled: input.slaEnabled,
  }).where(eq(organizations.id, orgId))
  
  // Log general settings update
  await writeAudit({ orgId, actorId: input.actorId || null, action: "ORG_SETTINGS_UPDATED", targetType: "organization", targetId: orgId, ipHash: input.ipHash || null, uaHash: input.uaHash || null })
  
  // Log specific SLA changes if they occurred
  if (input.slaEnabled !== undefined && currentOrg && input.slaEnabled !== (currentOrg.slaEnabled as boolean ?? true)) {
    const slaAction = input.slaEnabled ? "SLA_ENABLED" : "SLA_DISABLED"
    await writeAudit({ orgId, actorId: input.actorId || null, action: slaAction, targetType: "organization", targetId: orgId, ipHash: input.ipHash || null, uaHash: input.uaHash || null })
  }
  
  // Log specific SLA time changes if they occurred
  if (input.ackDays !== undefined && currentOrg && input.ackDays !== (currentOrg.ackDays as number ?? 7)) {
    await writeAudit({ orgId, actorId: input.actorId || null, action: "SLA_ACK_DAYS_CHANGED", targetType: "organization", targetId: orgId, ipHash: input.ipHash || null, uaHash: input.uaHash || null })
  }
  
  if (input.feedbackMonths !== undefined && currentOrg && input.feedbackMonths !== (currentOrg.feedbackMonths as number ?? 3)) {
    await writeAudit({ orgId, actorId: input.actorId || null, action: "SLA_FEEDBACK_MONTHS_CHANGED", targetType: "organization", targetId: orgId, ipHash: input.ipHash || null, uaHash: input.uaHash || null })
  }
}

export async function addCategory(orgId: string, name: string, actorId?: string | null, ipHash?: string | null, uaHash?: string | null) {
  const [row] = await db.insert(reportCategories).values({ orgId, name }).returning()
  await writeAudit({ orgId, actorId: actorId || null, action: "CATEGORY_CREATED", targetType: "category", targetId: row.id, ipHash: ipHash || null, uaHash: uaHash || null })
}

export async function setCategoryActive(orgId: string, categoryId: string, active: boolean, actorId?: string | null, ipHash?: string | null, uaHash?: string | null) {
  await db.update(reportCategories).set({ active }).where(eq(reportCategories.id, categoryId))
  await writeAudit({ orgId, actorId: actorId || null, action: active ? "CATEGORY_ACTIVATED" : "CATEGORY_DEACTIVATED", targetType: "category", targetId: categoryId, ipHash: ipHash || null, uaHash: uaHash || null })
}


