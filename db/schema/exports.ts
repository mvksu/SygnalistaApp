import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { organizations } from "./organizations"

export const exportType = pgEnum("export_type", ["REGISTER", "AUDIT"])

export const exportsTable = pgTable("exports", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  period: text("period").notNull(), // e.g., 2025-08
  type: exportType("type").notNull(),
  checksum: text("checksum").notNull(),
  storageKey: text("storage_key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
})

export type InsertExport = typeof exportsTable.$inferInsert
export type SelectExport = typeof exportsTable.$inferSelect


