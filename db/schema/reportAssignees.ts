import {
  pgTable,
  uuid,
  text,
  timestamp,
  primaryKey,
  index
} from "drizzle-orm/pg-core"
import { orgMembers } from "./orgMembers"
import { reports } from "./reports"

// NEW: report_assignees – many-to-many between reports and org_members
export const reportAssignees = pgTable(
  "report_assignees",
  {
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    orgMemberId: uuid("org_member_id")
      .notNull()
      .references(() => orgMembers.id, { onDelete: "cascade" }),
    // optional metadata
    addedAt: timestamp("added_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    addedByOrgMemberId: uuid("added_by_org_member_id").references(
      () => orgMembers.id,
      { onDelete: "set null" }
    )
  },
  t => ({
    pk: primaryKey({ columns: [t.reportId, t.orgMemberId] }),
    idxByReport: index("report_assignees_report_idx").on(t.reportId),
    idxByMember: index("report_assignees_member_idx").on(t.orgMemberId)
  })
)
