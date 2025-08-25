import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { db } from '@/db'
import { and, eq, inArray } from 'drizzle-orm'
import { reportAssignees } from '@/db/schema/reportAssignees'
import { reports } from '@/db/schema/reports'
import { getActorOrgMemberId } from '@/db/schema/orgMembers'
import { logReport } from '@/src/server/services/reportLogs'
import { users } from '@/db/schema/users'
import { getDbOrgIdForClerkOrg } from '@/src/server/orgs'

const Body = z.object({
  add: z.array(z.string().uuid()).optional(),
  remove: z.array(z.string().uuid()).optional()
})

/**
 * GET /api/reports/[id]/assignees
 * Returns the current list of assignee orgMemberIds for a report (from DB)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params
  if (!reportId) {
    return NextResponse.json({ error: 'Missing report id' }, { status: 400 })
  }

  const rows = await db
    .select({ orgMemberId: reportAssignees.orgMemberId })
    .from(reportAssignees)
    .where(eq(reportAssignees.reportId, reportId))

  return NextResponse.json({ assignees: rows.map(r => r.orgMemberId) })
}

/**
 * POST /api/reports/[id]/assignees
 * Body: { add?: string[], remove?: string[] }
 * Adds and/or removes orgMemberIds from the assignees of the report (in DB)
 * Each change is logged via logReport
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params
  if (!reportId) {
    return NextResponse.json({ error: 'Missing report id' }, { status: 400 })
  }

  let parsedBody: z.infer<typeof Body>
  try {
    parsedBody = Body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { userId: clerkUserId, orgId: clerkOrgId } = await auth()
  if (!clerkUserId || !clerkOrgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Map Clerk IDs → DB IDs
  const dbOrgId = await getDbOrgIdForClerkOrg(clerkOrgId)
  if (!dbOrgId) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }
  const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, clerkUserId) })

  // Ensure the report belongs to the current org (DB)
  const report = await db.query.reports.findFirst({ where: eq(reports.id, reportId) })
  if (!report || report.orgId !== dbOrgId) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  const actorOrgMemberId = dbUser
    ? await getActorOrgMemberId({ userId: dbUser.id, orgId: dbOrgId })
    : null

  // Add assignees
  if (parsedBody.add && parsedBody.add.length > 0) {
    for (const memberId of parsedBody.add) {
      await db
        .insert(reportAssignees)
        .values({ reportId, orgMemberId: memberId, addedByOrgMemberId: actorOrgMemberId ?? null })
        .onConflictDoNothing()

      await logReport({
        reportId,
        orgMemberId: actorOrgMemberId,
        type: 'assignment_added',
        message: `Assigned org_member_id=${memberId}`
      })
    }
  }

  // Remove assignees
  if (parsedBody.remove && parsedBody.remove.length > 0) {
    await db
      .delete(reportAssignees)
      .where(
        and(
          eq(reportAssignees.reportId, reportId),
          inArray(reportAssignees.orgMemberId, parsedBody.remove)
        )
      )

    for (const memberId of parsedBody.remove) {
      await logReport({
        reportId,
        orgMemberId: actorOrgMemberId,
        type: 'assignment_removed',
        message: `Unassigned org_member_id=${memberId}`
      })
    }
  }

  // Return updated list
  const rows = await db
    .select({ orgMemberId: reportAssignees.orgMemberId })
    .from(reportAssignees)
    .where(eq(reportAssignees.reportId, reportId))

  return NextResponse.json({ assignees: rows.map(r => r.orgMemberId) })
}
