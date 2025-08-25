import { db } from "@/db"
import { orgMembers } from "@/db/schema/orgMembers"
import { and, eq } from "drizzle-orm"

export async function getActorOrgMemberId(userId: string, orgId: string) {
  const row = await db
    .select({ id: orgMembers.id })
    .from(orgMembers)
    .where(and(eq(orgMembers.userId, userId), eq(orgMembers.orgId, orgId)))
    .limit(1)
  return row[0]?.id ?? null
}
