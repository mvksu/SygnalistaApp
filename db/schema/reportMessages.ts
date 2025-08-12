import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { reports } from "./reports"

export const messageSender = pgEnum("message_sender", ["REPORTER", "HANDLER"])

export const reportMessages = pgTable("report_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  sender: messageSender("sender").notNull(),
  bodyEncrypted: text("body_encrypted").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
})

export type InsertReportMessage = typeof reportMessages.$inferInsert
export type SelectReportMessage = typeof reportMessages.$inferSelect
