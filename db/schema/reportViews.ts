import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core"
import { reports } from "./reports"

export const reportViews = pgTable("report_views", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewed_at").defaultNow().notNull()
})

export type ReportView = typeof reportViews.$inferSelect
