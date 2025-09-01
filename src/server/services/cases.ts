import { db } from "@/db"
import { reports, SelectReport } from "@/db/schema/reports"
import { reportCategories } from "@/db/schema/reportCategories"
import { reportAssignees } from "@/db/schema/reportAssignees"
import { orgMembers } from "@/db/schema/orgMembers"
import { users } from "@/db/schema/users"
import { reportLogs } from "@/db/schema/reportLogs"
import { and, eq, ilike, inArray, gte, lte, SQL, desc } from "drizzle-orm"
import { organizations } from "@/db/schema/organizations"

export type CaseListItem = {
  id: string
  caseId: string
  categoryName: string
  status: SelectReport["status"]
  createdAt: Date
  acknowledgedAt: Date | null
  feedbackDueAt: Date | null
  ackDueAt: Date
  ackStatus: "due" | "overdue" | "done"
  feedbackStatus: "due" | "overdue" | "done"
  subject: string
  severity: string
  nextDeadline: Date | null
  lastActivity: Date
  lastActivityType: string | null
  assignees: { id: string; name: string }[]
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function computeStatuses(row: {
  createdAt: Date
  acknowledgedAt: Date | null
  feedbackDueAt: Date | null
  status: string
}, orgAckDays: number) {
  const now = new Date()
  const ackDueAt = addDays(row.createdAt, orgAckDays)
  const ackDone = !!row.acknowledgedAt
  const ackOverdue = !ackDone && now > ackDueAt
  const ackStatus: "due" | "overdue" | "done" = ackDone ? "done" : ackOverdue ? "overdue" : "due"

  let feedbackStatus: "due" | "overdue" | "done" = "due"
  if (row.status === "FEEDBACK_GIVEN" || row.status === "CLOSED") feedbackStatus = "done"
  else if (row.feedbackDueAt && now > row.feedbackDueAt) feedbackStatus = "overdue"

  return { ackDueAt, ackStatus, feedbackStatus }
}

export async function listCases(
  orgId: string,
  options?: {
    status?:
      | "OPEN"
      | "ACKNOWLEDGED"
      | "IN_PROGRESS"
      | "FEEDBACK_GIVEN"
      | "CLOSED"
    categoryId?: string
    search?: string
    limit?: number
    offset?: number
    from?: Date
    to?: Date
  }
): Promise<CaseListItem[]> {
  const {
    status,
    categoryId,
    search,
    limit = 50,
    offset = 0,
    from,
    to
  } = options || {}

  const whereClauses: SQL[] = [eq(reports.orgId, orgId)]
  if (status) whereClauses.push(eq(reports.status, status))
  if (categoryId) whereClauses.push(eq(reports.categoryId, categoryId))
  if (search) {
    // broaden search to subject OR caseId
    whereClauses.push(
      ilike(reports.caseId, `%${search}%`) // keep your original
    )
  }
  if (from) whereClauses.push(gte(reports.createdAt, from))
  if (to) whereClauses.push(lte(reports.createdAt, to))

  // 1) Base rows (one per report)
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) })
  const ackDays = (org?.ackDays as number) ?? 7
  const rows = await db
    .select({
      id: reports.id,
      caseId: reports.caseId,
      subject: reports.subject,
      categoryName: reportCategories.name,
      status: reports.status,
      createdAt: reports.createdAt,
      acknowledgedAt: reports.acknowledgedAt,
      feedbackDueAt: reports.feedbackDueAt
    })
    .from(reports)
    .innerJoin(reportCategories, eq(reportCategories.id, reports.categoryId))
    .where(and(...whereClauses))
    .limit(limit)
    .offset(offset)

  if (rows.length === 0) return []

  // 2) Fetch assignees for all those reports in one go
  const reportIds = rows.map(r => r.id)
  const assigneeRows = await db
    .select({
      reportId: reportAssignees.reportId,
      userId: users.id,
      name: users.name
    })
    .from(reportAssignees)
    .leftJoin(orgMembers, eq(orgMembers.id, reportAssignees.orgMemberId))
    .leftJoin(users, eq(users.id, orgMembers.userId))
    .where(inArray(reportAssignees.reportId, reportIds))

  // 3) Fetch last activity for all reports
  const lastActivityRows = await db
    .select({
      reportId: reportLogs.reportId,
      lastActivity: reportLogs.createdAt,
      lastActivityType: reportLogs.type
    })
    .from(reportLogs)
    .where(inArray(reportLogs.reportId, reportIds))
    .orderBy(desc(reportLogs.createdAt))

  // 4) Index assignees by reportId
  const idToAssignees = new Map<string, { id: string; name: string }[]>()
  for (const a of assigneeRows) {
    if (!a.reportId || !a.userId) continue
    const arr = idToAssignees.get(a.reportId) || []
    arr.push({ id: a.userId, name: a.name ?? "—" })
    idToAssignees.set(a.reportId, arr)
  }

  // 5) Index last activity by reportId
  const idToLastActivity = new Map<string, { lastActivity: Date; lastActivityType: string }>()
  for (const activity of lastActivityRows) {
    if (!idToLastActivity.has(activity.reportId)) {
      idToLastActivity.set(activity.reportId, {
        lastActivity: activity.lastActivity as Date,
        lastActivityType: activity.lastActivityType
      })
    }
  }

  // 6) Map to CaseListItem with computed statuses + assignees
  return rows.map(r => {
    const { ackDueAt, ackStatus, feedbackStatus } = computeStatuses({
      createdAt: r.createdAt,
      acknowledgedAt: r.acknowledgedAt,
      feedbackDueAt: r.feedbackDueAt,
      status: r.status
    }, ackDays)
    const nextDeadline = r.acknowledgedAt ? (r.feedbackDueAt ?? null) : ackDueAt
    const lastActivityData = idToLastActivity.get(r.id)
    return {
      id: r.id,
      caseId: r.caseId,
      subject: r.subject || "—",
      categoryName: r.categoryName,
      status: r.status,
      createdAt: r.createdAt,
      acknowledgedAt: (r.acknowledgedAt as Date | null) ?? null,
      feedbackDueAt: (r.feedbackDueAt as Date | null) ?? null,
      ackDueAt,
      ackStatus,
      feedbackStatus,
      severity: "—",
      nextDeadline,
      lastActivity: lastActivityData?.lastActivity || r.createdAt as Date,
      lastActivityType: lastActivityData?.lastActivityType || null,
      assignees: idToAssignees.get(r.id) || [] // ← attach nested assignees
    }
  })
}

// Row shape suitable for CaseTable component
export type CaseTableRow = {
  id: string
  caseId: string
  subject?: string
  category: string
  assignees: { id?: string; name: string }[]
  status: string
  createdAt: Date
  acknowledgedAt: Date | null
  feedbackDueAt: Date | null
  ackDueAt: Date
  ackStatus: "due" | "overdue" | "done"
  feedbackStatus: "due" | "overdue" | "done"
  lastActivity: Date
  lastActivityType: string | null
}

export async function listAssignedCaseRows(orgId: string, orgMemberId: string): Promise<CaseTableRow[]> {
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) })
  const ackDays = (org?.ackDays as number) ?? 7
  const base = await db
    .select({
      id: reports.id,
      caseId: reports.caseId,
      subject: reports.subject,
      status: reports.status,
      createdAt: reports.createdAt,
      acknowledgedAt: reports.acknowledgedAt,
      feedbackDueAt: reports.feedbackDueAt,
      categoryName: reportCategories.name,
    })
    .from(reports)
    .leftJoin(reportCategories, eq(reportCategories.id, reports.categoryId))
    .innerJoin(reportAssignees, eq(reportAssignees.reportId, reports.id))
    .where(and(eq(reports.orgId, orgId), eq(reportAssignees.orgMemberId, orgMemberId)))

  const reportIds = base.map(b => b.id)
  const assignees = reportIds.length
    ? await db
        .select({
          reportId: reportAssignees.reportId,
          name: users.name,
        })
        .from(reportAssignees)
        .leftJoin(orgMembers, eq(orgMembers.id, reportAssignees.orgMemberId))
        .leftJoin(users, eq(users.id, orgMembers.userId))
        .where(inArray(reportAssignees.reportId, reportIds))
    : []
  const idToAssignees = new Map<string, { name: string }[]>()
  for (const a of assignees) {
    const arr = idToAssignees.get(a.reportId) || []
    if (a.name) arr.push({ name: a.name })
    idToAssignees.set(a.reportId, arr)
  }

  // Fetch last activity for assigned reports
  const lastActivityRows = await db
    .select({
      reportId: reportLogs.reportId,
      lastActivity: reportLogs.createdAt,
      lastActivityType: reportLogs.type
    })
    .from(reportLogs)
    .where(inArray(reportLogs.reportId, reportIds))
    .orderBy(desc(reportLogs.createdAt))

  const idToLastActivity = new Map<string, { lastActivity: Date; lastActivityType: string }>()
  for (const activity of lastActivityRows) {
    if (!idToLastActivity.has(activity.reportId)) {
      idToLastActivity.set(activity.reportId, {
        lastActivity: activity.lastActivity as Date,
        lastActivityType: activity.lastActivityType
      })
    }
  }

  return base.map(b => {
    const { ackDueAt, ackStatus, feedbackStatus } = computeStatuses({
      createdAt: b.createdAt as Date,
      acknowledgedAt: (b.acknowledgedAt as Date | null) ?? null,
      feedbackDueAt: (b.feedbackDueAt as Date | null) ?? null,
      status: b.status as string,
    }, ackDays)
    const lastActivityData = idToLastActivity.get(b.id)
    return {
      id: b.id as string,
      caseId: b.caseId as string,
      subject: b.subject || undefined,
      category: (b.categoryName as string) || "Uncategorized",
      assignees: idToAssignees.get(b.id) || [],
      status: b.status as string,
      createdAt: b.createdAt as Date,
      acknowledgedAt: (b.acknowledgedAt as Date | null) ?? null,
      feedbackDueAt: (b.feedbackDueAt as Date | null) ?? null,
      ackDueAt,
      ackStatus,
      feedbackStatus,
      lastActivity: lastActivityData?.lastActivity || b.createdAt as Date,
      lastActivityType: lastActivityData?.lastActivityType || null
    }
  })
}

export type CaseSummary = {
  total: number
  inPeriod: number
  newCases: number
  open: number
  closed: number
}

export async function getCaseSummary(orgId: string, period?: { from?: Date; to?: Date }): Promise<CaseSummary> {
  const [totalRows, periodRows, openRows, closedRows] = await Promise.all([
    db.select({ id: reports.id }).from(reports).where(eq(reports.orgId, orgId)),
    period?.from || period?.to
      ? db
          .select({ id: reports.id })
          .from(reports)
          .where(
            and(
              eq(reports.orgId, orgId),
              ...(period.from ? [gte(reports.createdAt, period.from)] : []),
              ...(period.to ? [lte(reports.createdAt, period.to)] : [])
            )
          )
      : db.select({ id: reports.id }).from(reports).where(eq(reports.orgId, orgId)),
    db.select({ id: reports.id }).from(reports).where(and(eq(reports.orgId, orgId), eq(reports.status, "OPEN"))),
    db
      .select({ id: reports.id })
      .from(reports)
      .where(and(eq(reports.orgId, orgId), eq(reports.status, "CLOSED"))),
  ])

  return {
    total: totalRows.length,
    inPeriod: periodRows.length,
    newCases: periodRows.length,
    open: openRows.length,
    closed: closedRows.length,
  }
}


