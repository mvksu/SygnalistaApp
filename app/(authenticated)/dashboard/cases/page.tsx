import { auth } from "@clerk/nextjs/server"
import { listCases, getCaseSummary } from "@/src/server/services/cases"
import { CaseTable } from "@/components/cases/case-table"
import { db } from "@/db"
import { reportCategories } from "@/db/schema/reportCategories"
import { CasesControls } from "./cases-controls"
import { eq } from "drizzle-orm"
import { DataTable } from "../_components/data-table"

export default async function CasesPage({
  searchParams
}: {
  searchParams: Promise<{
    status?: string
    categoryId?: string
    q?: string
    period?: string
  }>
}) {
  const sp = (await searchParams) || {}

  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return null
  const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
  const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)

  // Map period to date range
  let from: Date | undefined
  if (sp.period === "7d") {
    from = new Date()
    from.setDate(from.getDate() - 7)
  } else if (sp.period === "30d") {
    from = new Date()
    from.setDate(from.getDate() - 30)
  }

  const allowedStatuses = [
    "OPEN",
    "ACKNOWLEDGED",
    "IN_PROGRESS",
    "FEEDBACK_GIVEN",
    "CLOSED"
  ] as const
  const qStatus = sp.status
  const statusFilter: (typeof allowedStatuses)[number] | undefined =
    qStatus && (allowedStatuses as readonly string[]).includes(qStatus)
      ? (qStatus as (typeof allowedStatuses)[number])
      : undefined

  const baseRows = await listCases(orgId, {
    status: statusFilter,
    categoryId: sp.categoryId,
    search: sp.q,
    from
  })
  const rows = (baseRows || []).map(r => ({
    id: r.id,
    caseId: r.caseId,
    subject: r.subject,
    category: r.categoryName,
    assignees: r.assignees.map(a => ({ id: a.id, name: a.name })),
    status: r.status,
    createdAt: r.createdAt,
    acknowledgedAt: r.acknowledgedAt,
    feedbackDueAt: r.feedbackDueAt,
    ackDueAt: r.ackDueAt,
    ackStatus: r.ackStatus,
    feedbackStatus: r.feedbackStatus
  }))

  const summary = await getCaseSummary(orgId)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Cases</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-md border p-4">
          <div className="text-muted-foreground text-xs uppercase">Cases</div>
          <div className="mt-1 text-2xl font-semibold">
            {summary.total}{" "}
            <span className="text-muted-foreground text-base">
              / {summary.inPeriod}
            </span>
          </div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-muted-foreground text-xs uppercase">
            New cases
          </div>
          <div className="mt-1 text-2xl font-semibold">{summary.newCases}</div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-muted-foreground text-xs uppercase">
            Open cases
          </div>
          <div className="mt-1 text-2xl font-semibold">{summary.open}</div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-muted-foreground text-xs uppercase">
            Closed cases
          </div>
          <div className="mt-1 text-2xl font-semibold">{summary.closed}</div>
        </div>
      </div>

      {/* Controls */}
      <CasesControls
        initialQ={sp.q}
        initialStatus={sp.status}
        initialCategoryId={sp.categoryId}
        initialPeriod={sp.period}
        categories={await db
          .select({ id: reportCategories.id, name: reportCategories.name })
          .from(reportCategories)
          .where(eq(reportCategories.orgId, orgId))}
      />
      <DataTable data={rows} />
    </div>
  )
}


