// db/schema/orgSubscriptions.ts
import { pgTable, uuid, varchar, text, timestamp, pgEnum } from "drizzle-orm/pg-core"

export const membership = pgEnum("membership", ["free", "pro"])

export const organizationSubscriptions = pgTable("organization_subscriptions", {
  orgId: uuid("org_id").primaryKey(), // Clerk org id (UUID) lub Twój UUID
  membership: membership("membership").default("pro").notNull(), // 'free' | 'pro'
  stripeOrgId: text("stripe_organization_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
})

export type SelectOrgSubscription = {
  orgId: string
  membership: "free" | "pro"
  stripeSubscriptionId: string | null
  updatedAt: Date | null
}
