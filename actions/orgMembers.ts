import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { orgMembers } from "@/db/schema/orgMembers"

export async function getActorOrgMemberId(opts: {
  userId: string
  orgId: string
}) {
  const row = await db
    .select({ id: orgMembers.id })
    .from(orgMembers)
    .where(
      and(eq(orgMembers.userId, opts.userId), eq(orgMembers.orgId, opts.orgId))
    )
    .limit(1)
  return row[0]?.id ?? null
}
