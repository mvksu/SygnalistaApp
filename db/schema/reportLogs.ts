import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core"
import { reports } from "./reports"
import { orgMembers } from "./orgMembers"

export const reportLogs = pgTable(
  "report_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    // who wrote it (optional, nullable if system)
    orgMemberId: uuid("org_member_id").references(() => orgMembers.id, {
      onDelete: "set null"
    }),

    // type & payload
    type: text("type").notNull(), // e.g. 'status_changed' | 'comment' | 'assignment_added' | …
    message: text("message").notNull(), // human-readable line (stored plain for easy display)

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  t => ({
    idxByReportTime: index("report_logs_report_time_idx").on(
      t.reportId,
      t.createdAt
    )
  })
)

export type ReportLog = typeof reportLogs.$inferSelect