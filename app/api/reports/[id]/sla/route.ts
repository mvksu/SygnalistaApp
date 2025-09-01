import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { reports } from "@/db/schema/reports"
import { organizations } from "@/db/schema/organizations"
import { slaEvents } from "@/db/schema/sla"
import { and, eq, desc } from "drizzle-orm"
import { assertRoleInOrg } from "@/lib/authz"

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: reportId } = await params
    const { orgId } = await assertRoleInOrg(["ADMIN", "HANDLER", "AUDITOR"]) // allow read

    const rpt = await db.query.reports.findFirst({ where: and(eq(reports.id, reportId), eq(reports.orgId, orgId)) })
    if (!rpt) return NextResponse.json({ error: "not_found" }, { status: 404 })

    const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) })
    
    // Check if SLA is enabled for this organization
    if (!(org?.slaEnabled as boolean ?? true)) {
      return NextResponse.json({
        slaDisabled: true,
        message: "SLA tracking is disabled for this organization"
      })
    }
    
    const ackDays = (org?.ackDays as number) ?? 7
    const now = new Date()

    const ackDueAt = (rpt.ackDueAt as Date | null) ?? addDays(rpt.createdAt as Date, ackDays)
    const ackStatus: "due" | "overdue" | "done" = rpt.acknowledgedAt ? "done" : (now > ackDueAt ? "overdue" : "due")

    const feedbackDueAt = (rpt.feedbackDueAt as Date | null) ?? null
    let feedbackStatus: "due" | "overdue" | "done" = "due"
    const st: string = (rpt.status as unknown as string) || ""
    if (st === "FEEDBACK_GIVEN" || st === "CLOSED") feedbackStatus = "done"
    else if (feedbackDueAt && now > feedbackDueAt) feedbackStatus = "overdue"

    const events = await db
      .select()
      .from(slaEvents)
      .where(eq(slaEvents.reportId, reportId))
      .orderBy(desc(slaEvents.createdAt))
      .limit(10)

    return NextResponse.json({
      ackDueAt,
      ackStatus,
      feedbackDueAt,
      feedbackStatus,
      events,
    })
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}


