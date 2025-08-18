import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { organizations } from "./organizations"
import { reportCategories } from "./reportCategories"
import { users } from "./users"

export const reporterMode = pgEnum("reporter_mode", ["ANON", "IDENTIFIED"])
export const reportStatus = pgEnum("report_status", [
  "OPEN",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "FEEDBACK_GIVEN",
  "CLOSED"
])

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => reportCategories.id, { onDelete: "restrict" }),
  subject: text("subject"),
  status: reportStatus("status").default("OPEN").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledged_at"),
  feedbackDueAt: timestamp("feedback_due_at"),
  reporterMode: reporterMode("reporter_mode").default("ANON").notNull(),
  reporterContactEncrypted: text("reporter_contact_encrypted"),
  assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
  caseId: text("case_id").notNull().unique(),
  caseKeyHash: text("case_key_hash").notNull()
})

export type InsertReport = typeof reports.$inferInsert
export type SelectReport = typeof reports.$inferSelect
