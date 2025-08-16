import { auth } from "@clerk/nextjs/server"
import { listCases, getCaseSummary } from "@/src/server/services/cases"
import { CaseTable } from "@/components/cases/case-table"

export default async function CasesPage({ searchParams }: { searchParams: { status?: string; categoryId?: string; q?: string; period?: string } }) {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return null
  const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
  const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)

  const rows = await listCases(orgId, {
    status: searchParams?.status,
    categoryId: searchParams?.categoryId,
    search: searchParams?.q,
  })

  const summary = await getCaseSummary(orgId)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Cases</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-md border p-4">
          <div className="text-xs uppercase text-muted-foreground">Cases</div>
          <div className="text-2xl font-semibold mt-1">{summary.total} <span className="text-muted-foreground text-base">/ {summary.inPeriod}</span></div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-xs uppercase text-muted-foreground">New cases</div>
          <div className="text-2xl font-semibold mt-1">{summary.newCases}</div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-xs uppercase text-muted-foreground">Open cases</div>
          <div className="text-2xl font-semibold mt-1">{summary.open}</div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-xs uppercase text-muted-foreground">Closed cases</div>
          <div className="text-2xl font-semibold mt-1">{summary.closed}</div>
        </div>
      </div>

      {/* Controls row (search/filters/period) - placeholder visuals */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <input className="border rounded px-3 py-2 text-sm" placeholder="Search receipt..." defaultValue={searchParams?.q || ""} name="q" />
          <button className="text-sm underline">Filters</button>
          <button className="text-sm underline">Advanced search</button>
        </div>
        <div className="flex items-center gap-2">
          <select className="border rounded px-3 py-2 text-sm" defaultValue={searchParams?.period || "all"}>
            <option value="all">All time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <button className="text-sm underline">Options</button>
        </div>
      </div>

      <CaseTable rows={rows} />
    </div>
  )
}


