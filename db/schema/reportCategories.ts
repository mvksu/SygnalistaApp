import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { organizations } from "./organizations"

export const reportCategories = pgTable("report_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertReportCategory = typeof reportCategories.$inferInsert
export type SelectReportCategory = typeof reportCategories.$inferSelect
