import { NextRequest, NextResponse } from "next/server"
import { assertRoleInOrg, assertCanAccessReport } from "@/lib/authz"
import { updateReportStatus } from "@/src/server/services/reports"
import { z } from "zod"
import { logReport } from "@/src/server/services/reportLogs"

const Body = z.object({
  status: z.enum([
    "ACKNOWLEDGED",
    "FEEDBACK_GIVEN",
    "IN_PROGRESS",
    "CLOSED",
    "OPEN"
  ])
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let parsed: unknown
    const ct = request.headers.get("content-type") || ""
    if (ct.includes("application/json")) {
      parsed = await request.json()
    } else {
      const text = await request.text()
      parsed = text ? JSON.parse(text) : undefined
    }

    const { status } = Body.parse(parsed)
    const { userId, orgId, role } = await assertRoleInOrg(["ADMIN", "HANDLER"]) 
    const { id: reportId } = await params
    await assertCanAccessReport({ orgId, userId, role, reportId })
    console.log(status)

    await updateReportStatus({
      orgId,
      reportId,
      actorId: userId,
      status: status
    })
    await logReport({
      reportId,
      orgMemberId: userId, // <- UUID or null
      type: "status_changed",
      message: `Status: → ${status}`
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json(
      { error: `Internal server error ${err}` },
      { status: 500 }
    )
  }
}
