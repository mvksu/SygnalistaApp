import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { organizations } from "./organizations"
import { users } from "./users"

export const orgRole = pgEnum("org_role", ["ADMIN", "HANDLER", "AUDITOR"]) 

export const orgMembers = pgTable("org_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: orgRole("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertOrgMember = typeof orgMembers.$inferInsert
export type SelectOrgMember = typeof orgMembers.$inferSelect


