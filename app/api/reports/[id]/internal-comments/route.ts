import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/db"
import { reportLogs } from "@/db/schema/reportLogs"
import { eq } from "drizzle-orm"
import { reports } from "@/db/schema/reports"
import { getDbOrgIdForClerkOrg } from "@/src/server/orgs"
import { orgMembers } from "@/db/schema/orgMembers"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { orgId: clerkOrgId, userId } = await auth()
    if (!clerkOrgId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
    const { id } = params
    const payload = await req.json()
    const body = String(payload?.body || "").trim()
    if (!body) return NextResponse.json({ error: "Empty" }, { status: 400 })

    // ensure report belongs to org
    const [r] = await db.select({ id: reports.id }).from(reports).where(eq(reports.id, id))
    if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // find org member id for user
    const member = await db.query.orgMembers.findFirst({ where: eq(orgMembers.userId, userId) })

    const inserted = await db
      .insert(reportLogs)
      .values({
        reportId: id,
        orgMemberId: member?.id || null,
        type: "internal_comment",
        message: body,
      })
      .returning()

    return NextResponse.json({
      id: inserted[0].id,
      message: inserted[0].message,
      createdAt: inserted[0].createdAt,
      userName: member ? null : null,
    })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}



