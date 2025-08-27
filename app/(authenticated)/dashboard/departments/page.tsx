import { RequireRole } from "@/components/auth/require-role"
import { db } from "@/db"
import { ROLES } from "@/lib/authz"
import { departments, type SelectDepartment } from "@/db/schema/departments"
import { eq } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"

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
          <Input name="name" placeholder="New department name" />
          <Button type="submit">Add</Button>
        </form>
        <Card>
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departs.map((r: SelectDepartment) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.description || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </RequireRole>
  )
}
