// actions/organizations.ts (server action / serwis na backendzie)
"use server"

import { db } from "@/db"
import { eq } from "drizzle-orm"
import { organizationSubscriptions } from "@/db/schema/orgSubscriptions"

// opcjonalnie: rodzaj zwracanych danych
export type OrgSubscription =
  | { orgId: string; membership: "pro"; stripeSubscriptionId: string | null }
  | { orgId: string; membership: "free"; stripeSubscriptionId: string | null }

export async function getOrganizationSubscription(
  orgId: string
): Promise<OrgSubscription> {
  if (!orgId) {
    // brak kontekstu organizacji => traktuj jak free
    return { orgId: "", membership: "free", stripeSubscriptionId: null }
  }

  const rows = await db
    .select({
      orgId: organizationSubscriptions.orgId,
      membership: organizationSubscriptions.membership,
      stripeSubscriptionId: organizationSubscriptions.stripeSubscriptionId
    })
    .from(organizationSubscriptions)
    .where(eq(organizationSubscriptions.orgId, orgId))
    .limit(1)

  // fallback bezpieczeństwa: brak rekordu = 'free'
  if (!rows.length) {
    return { orgId, membership: "free", stripeSubscriptionId: null }
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
