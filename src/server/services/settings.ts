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
  await db.update(organizations).set({
    name: input.name,
    locale: input.locale,
    retentionDays: input.retentionDays as any,
    anonymousAllowed: input.anonymousAllowed,
    ackDays: input.ackDays as any,
    feedbackMonths: input.feedbackMonths as any,
    slaEnabled: input.slaEnabled,
  }).where(eq(organizations.id, orgId))
  await writeAudit({ orgId, actorId: input.actorId || null, action: "ORG_SETTINGS_UPDATED", targetType: "organization", targetId: orgId, ipHash: input.ipHash || null, uaHash: input.uaHash || null })
}

export async function addCategory(orgId: string, name: string, actorId?: string | null, ipHash?: string | null, uaHash?: string | null) {
  const [row] = await db.insert(reportCategories).values({ orgId, name }).returning()
  await writeAudit({ orgId, actorId: actorId || null, action: "CATEGORY_CREATED", targetType: "category", targetId: row.id, ipHash: ipHash || null, uaHash: uaHash || null })
}

export async function setCategoryActive(orgId: string, categoryId: string, active: boolean, actorId?: string | null, ipHash?: string | null, uaHash?: string | null) {
  await db.update(reportCategories).set({ active }).where(eq(reportCategories.id, categoryId))
  await writeAudit({ orgId, actorId: actorId || null, action: active ? "CATEGORY_ACTIVATED" : "CATEGORY_DEACTIVATED", targetType: "category", targetId: categoryId, ipHash: ipHash || null, uaHash: uaHash || null })
}


