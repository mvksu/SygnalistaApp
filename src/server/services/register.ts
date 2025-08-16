import { db } from "@/db"
import { reports } from "@/db/schema/reports"
import { reportCategories } from "@/db/schema/reportCategories"
import { and, eq, ilike, gte, lte } from "drizzle-orm"

export type RegisterRow = {
  id: string
  caseId: string
  categoryName: string
  status: string
  createdAt: Date
  acknowledgedAt: Date | null
  feedbackDueAt: Date | null
}

export async function listRegister(
  orgId: string,
  options?: {
    status?: string
    categoryId?: string
    search?: string
    from?: Date
    to?: Date
    limit?: number
    offset?: number
  }
): Promise<RegisterRow[]> {
  const { status, categoryId, search, from, to, limit = 100, offset = 0 } = options || {}

  const whereClauses: any[] = [eq(reports.orgId, orgId)]
  if (status) whereClauses.push(eq(reports.status, status as any))
  if (categoryId) whereClauses.push(eq(reports.categoryId, categoryId as any))
  if (search) whereClauses.push(ilike(reports.caseId, `%${search}%`))
  if (from) whereClauses.push(gte(reports.createdAt, from))
  if (to) whereClauses.push(lte(reports.createdAt, to))

  const rows = await db
    .select({
      id: reports.id,
      caseId: reports.caseId,
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

  return rows as unknown as RegisterRow[]
}

export async function ensureDefaultReportingChannel(orgId: string) {
  const { reportingChannels } = await import("@/db/schema/reportingChannels")
  const { eq } = await import("drizzle-orm")
  const existing = await db.query.reportingChannels.findFirst({ where: eq(reportingChannels.orgId, orgId) })
  if (existing) return existing
  const slug = crypto.randomUUID()
  const [inserted] = await db
    .insert(reportingChannels)
    .values({ orgId, name: "Default", slug, type: "links", defaultLanguage: "auto" })
    .returning()
  return inserted
}





