import { db } from "@/db"
import { reportLogs } from "@/db/schema/reportLogs"
import { z } from "zod"

const Uuid = z.uuid()

export async function logReport(opts: {
  reportId: string
  orgMemberId: string | null // must be UUID or null
  type:
    | "created"
    | "status_changed"
    | "assignment_added"
    | "assignment_removed"
    | "comment"
    | "updated"
  message: string
}) {
  const orgMemberId =
    opts.orgMemberId && Uuid.safeParse(opts.orgMemberId).success
      ? opts.orgMemberId
      : null

  await db.insert(reportLogs).values({
    reportId: opts.reportId,
    orgMemberId, // UUID or null
    type: opts.type,
    message: opts.message
  })
}
