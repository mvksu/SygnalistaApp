import { RequireRole } from "@/components/auth/require-role"
import { db } from "@/db"
import { ROLES } from "@/lib/authz"
import { departments } from "@/db/schema/departments"
import { eq } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"

export default async function DepartmentsPage() {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return null
  const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
  const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
  const departs = await db.query.departments.findMany({ where: eq(departments.orgId, orgId) })

  return (
    <RequireRole allowed={["ADMIN"] as (typeof ROLES)[number][]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Departments</h1>
          <p className="text-muted-foreground text-sm">
            Manage your organization departments.
          </p>
        </div>
        <form action="/api/departments" method="post" className="flex gap-2">
          <input
            name="name"
            className="rounded border px-3 py-2 text-sm"
            placeholder="New department name"
          />
          <button className="bg-primary text-primary-foreground rounded px-3 py-2 text-sm">
            Add
          </button>
        </form>
        <div className="overflow-hidden rounded border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              {departs.map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.description || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </RequireRole>
  )
}
