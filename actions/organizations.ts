// actions/organizations.ts (server action / serwis na backendzie)
"use server"

import { db } from "@/db"
import { eq } from "drizzle-orm"
import { organizationSubscriptions } from "@/db/schema/orgSubscriptions"
import { auth } from "@clerk/nextjs/server"
import { getDbOrgIdForClerkOrg } from "@/src/server/orgs"

// opcjonalnie: rodzaj zwracanych danych
export type OrgSubscription =
  | { orgId: string; membership: "pro"; stripeSubscriptionId: string | null }
  | { orgId: string; membership: "free"; stripeSubscriptionId: string | null }

export async function getOrganizationSubscription(
  
): Promise<OrgSubscription> {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) {
    // brak kontekstu organizacji => traktuj jak free
    return { orgId: "", membership: "free", stripeSubscriptionId: null }
  }

  const dbOrgId = await getDbOrgIdForClerkOrg(clerkOrgId)
  if (!dbOrgId) {
    return { orgId: "", membership: "free", stripeSubscriptionId: null }
  }

  const rows = await db
    .select({
      orgId: organizationSubscriptions.orgId,
      membership: organizationSubscriptions.membership,
      stripeSubscriptionId: organizationSubscriptions.stripeSubscriptionId
    })
    .from(organizationSubscriptions)
    .where(eq(organizationSubscriptions.orgId, dbOrgId))
    .limit(1)

  // fallback bezpieczeństwa: brak rekordu = 'free'
  if (!rows.length) {
    return { orgId: dbOrgId, membership: "free", stripeSubscriptionId: null }
  }

  // sanity check na wartość membership
  const row = rows[0]
  const membership = row.membership === "pro" ? "pro" : "free"
  return {
    orgId: row.orgId,
    membership,
    stripeSubscriptionId: row.stripeSubscriptionId
  }
}
