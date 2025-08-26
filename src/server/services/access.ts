import { db } from "@/db"
import { reports } from "@/db/schema/reports"
import { and, eq } from "drizzle-orm"
import { writeAudit } from "./audit"

/**
 * Break-glass access: Platform admin (or elevated role) can unlock a report content
 * after providing an explicit justification. This function records an audit event.
 *
 * NOTE: You must gate the caller separately (e.g., platform_admin check). This
 * does NOT bypass org tenancy; orgId must match.
 */
export async function breakGlassAccess(options: {
  orgId: string
  actorId: string
  reportId: string
  justification: string
}): Promise<{ ok: true }> {
  const rpt = await db.query.reports.findFirst({ where: and(eq(reports.id, options.reportId), eq(reports.orgId, options.orgId)) })
  if (!rpt) throw new Error("Report not found in this organization")

  await writeAudit({
    orgId: options.orgId,
    actorId: options.actorId,
    action: "BREAK_GLASS",
    targetType: "report",
    targetId: options.reportId,
    ipHash: null,
    uaHash: null,
  })

  // The caller can now proceed to fetch content via existing services using org keys.
  return { ok: true }
}



