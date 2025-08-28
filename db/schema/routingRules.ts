import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core"
import { organizations } from "./organizations"
import { reportCategories } from "./reportCategories"
import { reportingChannels } from "./reportingChannels"
import { orgMembers } from "./orgMembers"

export const routingRules = pgTable("routing_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => reportCategories.id, { onDelete: "set null" }),
  channelId: uuid("channel_id").references(() => reportingChannels.id, { onDelete: "set null" }),
  orgMemberId: uuid("org_member_id")
    .notNull()
    .references(() => orgMembers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export type InsertRoutingRule = typeof routingRules.$inferInsert
export type SelectRoutingRule = typeof routingRules.$inferSelect

