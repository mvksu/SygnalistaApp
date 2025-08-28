import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { auditLog } from "@/db/schema/audit"
import { users } from "@/db/schema/users"
import { orgMembers } from "@/db/schema/orgMembers"
import { eq, and, ilike, desc } from "drizzle-orm"
import { getDbOrgIdForClerkOrg } from "@/src/server/orgs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function formatDate(d?: Date | string | null) {
  if (!d) return "—"
  const date = typeof d === "string" ? new Date(d) : d
  return isNaN(date.getTime()) ? "—" : date.toLocaleString()
}

export default async function AuditPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; page?: string; size?: string }>
}) {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return null
  const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)

  const sp = (await searchParams) || {}
  const q = (sp.q || "").trim()
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1)
  const size = Math.min(100, Math.max(10, parseInt(sp.size || "25", 10) || 25))
  const offset = (page - 1) * size

  // Base where clause
  const where = [eq(auditLog.orgId, orgId)]
  if (q) {
    where.push(
      ilike(auditLog.action, `%${q}%`) as any
    )
  }

  const rows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      targetType: auditLog.targetType,
      targetId: auditLog.targetId,
      createdAt: auditLog.createdAt,
      actorName: users.name
    })
    .from(auditLog)
    .leftJoin(orgMembers, eq(orgMembers.id, auditLog.actorId))
    .leftJoin(users, eq(users.id, orgMembers.userId))
    .where(and(...where))
    .orderBy(desc(auditLog.createdAt))
    .limit(size)
    .offset(offset)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Audit logs</h1>
        <div className="text-muted-foreground text-sm">
          <Link href="/dashboard">Back to dashboard</Link>
        </div>
      </div>
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-base">Organization activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          <form className="flex flex-wrap items-center gap-3">
            <Input name="q" defaultValue={q} placeholder="Search action…" className="w-64" />
            <Select name="size" defaultValue={String(size)}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder={size} />
              </SelectTrigger>
              <SelectContent>
                {[25, 50, 100].map(s => (
                  <SelectItem key={s} value={String(s)}>{s} / page</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" variant="outline" size="sm">Apply</Button>
          </form>

          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">Time</th>
                  <th className="p-2 text-left">Actor</th>
                  <th className="p-2 text-left">Action</th>
                  <th className="p-2 text-left">Target</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                    <td className="p-2">{r.actorName || "System"}</td>
                    <td className="p-2">{r.action}</td>
                    <td className="p-2">{r.targetType}:{r.targetId}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td className="p-3 text-muted-foreground" colSpan={4}>No audit entries.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-xs">Page {page}</div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" disabled={page <= 1}>
                <Link href={`?q=${encodeURIComponent(q)}&size=${size}&page=${page - 1}`}>Previous</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`?q=${encodeURIComponent(q)}&size=${size}&page=${page + 1}`}>Next</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


