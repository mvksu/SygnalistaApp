import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { organizations } from "./organizations"

export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id"), // nullable for system events
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  ipHash: text("ip_hash"),
  uaHash: text("ua_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull()
})

export type InsertAuditLog = typeof auditLog.$inferInsert
export type SelectAuditLog = typeof auditLog.$inferSelect


