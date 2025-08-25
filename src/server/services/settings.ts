import { db } from "@/db"
import { organizations } from "@/db/schema/organizations"
import { reportCategories } from "@/db/schema/reportCategories"
import { eq } from "drizzle-orm"

export async function getOrgSettings(orgId: string) {
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) })
  return org
}

export async function updateOrgSettings(orgId: string, input: { name?: string; locale?: string; retentionDays?: number; anonymousAllowed?: boolean; ackDays?: number; feedbackMonths?: number }) {
  await db.update(organizations).set({
    name: input.name,
    locale: input.locale,
    retentionDays: input.retentionDays as any,
    anonymousAllowed: input.anonymousAllowed,
    ackDays: input.ackDays as any,
    feedbackMonths: input.feedbackMonths as any,
  }).where(eq(organizations.id, orgId))
}

export async function addCategory(orgId: string, name: string) {
  await db.insert(reportCategories).values({ orgId, name })
}


