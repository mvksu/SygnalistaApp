import { auth } from "@clerk/nextjs/server"
import { listRegister } from "@/src/server/services/register"
import { Button } from "@/components/ui/button"

export default async function RegisterPage({ searchParams }: { searchParams: { status?: string; categoryId?: string; q?: string } }) {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return null
  const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
  const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)

  const rows = await listRegister(orgId, {
    status: searchParams?.status,
    categoryId: searchParams?.categoryId,
    search: searchParams?.q,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Register</h1>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <input className="border rounded px-3 py-2 text-sm" placeholder="Search case id..." defaultValue={searchParams?.q || ""} name="q" />
          <Button className="underline" variant="link" size="sm">Filters</Button>
          <Button className="underline" variant="link" size="sm">Advanced search</Button>
        </div>
        <div className="flex items-center gap-2">
          <select className="border rounded px-3 py-2 text-sm" defaultValue={searchParams?.status || "all"}>
            <option value="all">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="FEEDBACK_GIVEN">Feedback given</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-md">
        <div className="flex justify-end p-2">
          <form action="/api/register/export" method="post">
            <Button className="border px-3 py-2 text-sm" type="submit" variant="outline" size="sm">
              Export CSV
            </Button>
          </form>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-2">Case ID</th>
              <th className="text-left p-2">Category</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Created</th>
              <th className="text-left p-2">Acknowledged</th>
              <th className="text-left p-2">Feedback due</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 font-mono">{(r as any).caseId || (r as any).receiptCode}</td>
                <td className="p-2">{r.categoryName}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
                <td className="p-2">{r.acknowledgedAt ? new Date(r.acknowledgedAt).toLocaleDateString() : "—"}</td>
                <td className="p-2">{r.feedbackDueAt ? new Date(r.feedbackDueAt).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


