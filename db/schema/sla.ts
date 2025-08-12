import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { reports } from "./reports"

export const slaEventType = pgEnum("sla_event_type", [
  "ACK_DUE",
  "FEEDBACK_DUE"
])

export const slaEventStatus = pgEnum("sla_event_status", [
  "PENDING",
  "SENT",
  "SKIPPED"
])

export const slaEvents = pgTable("sla_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  type: slaEventType("type").notNull(),
  dueAt: timestamp("due_at").notNull(),
  sentAt: timestamp("sent_at"),
  status: slaEventStatus("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
})

export type InsertSlaEvent = typeof slaEvents.$inferInsert
export type SelectSlaEvent = typeof slaEvents.$inferSelect


