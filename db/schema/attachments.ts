import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  integer
} from "drizzle-orm/pg-core"
import { reports } from "./reports"
import { reportMessages } from "./reportMessages"

export const avStatus = pgEnum("av_status", [
  "PENDING",
  "CLEAN",
  "INFECTED",
  "QUARANTINED"
])

export const attachments = pgTable("attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  messageId: uuid("message_id").references(() => reportMessages.id, {
    onDelete: "set null"
  }),
  storageKey: text("storage_key").notNull(),
  filename: text("filename").notNull(),
  size: integer("size").notNull(),
  contentHash: text("content_hash").notNull(),
  avStatus: avStatus("av_status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
})

export type InsertAttachment = typeof attachments.$inferInsert
export type SelectAttachment = typeof attachments.$inferSelect
