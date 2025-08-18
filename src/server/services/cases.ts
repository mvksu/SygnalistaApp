import { db } from "@/db"
import { reports } from "@/db/schema/reports"
import { reportCategories } from "@/db/schema/reportCategories"
import { and, eq, ilike, sql } from "drizzle-orm"

export type CaseListItem = {
  id: string
  caseId: string
  categoryName: string
  status: "OPEN" | "ACKNOWLEDGED" | "IN_PROGRESS" | "FEEDBACK_GIVEN" | "CLOSED"
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
}) {
  const now = new Date()
  const ackDueAt = addDays(row.createdAt, 7)
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
    status?: string
    categoryId?: string
    search?: string
    limit?: number
    offset?: number
    from?: Date
    to?: Date
  }
): Promise<CaseListItem[]> {
  const { status, categoryId, search, limit = 50, offset = 0, from, to } = options || {}

  const whereClauses = [eq(reports.orgId, orgId)] as any[]
  if (status) whereClauses.push(eq(reports.status, status as any))
  if (categoryId) whereClauses.push(eq(reports.categoryId, categoryId as any))
  if (search) whereClauses.push(ilike(reports.caseId, `%${search}%`))
  if (from) whereClauses.push(gte(reports.createdAt, from))
  if (to) whereClauses.push(lte(reports.createdAt, to))

  const rows = await db
    .select({
      id: reports.id,
      caseId: reports.caseId,
      subject: reports.subject,
      categoryName: reportCategories.name,
      status: reports.status,
      createdAt: reports.createdAt,
      acknowledgedAt: reports.acknowledgedAt,
      feedbackDueAt: reports.feedbackDueAt,
    })
    .from(reports)
    .innerJoin(reportCategories, eq(reportCategories.id, reports.categoryId))
    .where(and(...whereClauses))
    .limit(limit)
    .offset(offset)

  return rows.map((r) => {
    const { ackDueAt, ackStatus, feedbackStatus } = computeStatuses({
      createdAt: r.createdAt,
      acknowledgedAt: r.acknowledgedAt,
      feedbackDueAt: r.feedbackDueAt,
      status: r.status,
    })
    const nextDeadline = r.acknowledgedAt ? (r.feedbackDueAt ?? null) : ackDueAt
    return {
      id: r.id as string,
      caseId: r.caseId as string,
      subject: (r as any).subject || '—',
      categoryName: r.categoryName as string,
      status: r.status as any,
      createdAt: r.createdAt as Date,
      acknowledgedAt: (r.acknowledgedAt as Date | null) ?? null,
      feedbackDueAt: (r.feedbackDueAt as Date | null) ?? null,
      ackDueAt,
      ackStatus,
      feedbackStatus,
      severity: "—",
      nextDeadline,
      lastActivity: r.createdAt as Date,
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
              period.from ? gte(reports.createdAt, period.from) : ({} as any),
              period.to ? lte(reports.createdAt, period.to) : ({} as any)
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


