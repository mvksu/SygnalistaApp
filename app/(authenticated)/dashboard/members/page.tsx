import { auth, currentUser, clerkClient } from "@clerk/nextjs/server"
import { db } from "@/db"
import { orgMembers } from "@/db/schema/orgMembers"
import { users } from "@/db/schema/users"
import { and, eq } from "drizzle-orm"
import NewMemberButton from "./new-member-button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default async function MembersPage() {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return null
  const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
  const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)

  // Ensure current user exists and is an ADMIN member of this org
  const u = await currentUser()
  if (u?.id) {
    let dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, u.id)
    })
    if (!dbUser) {
      const [inserted] = await db
        .insert(users)
        .values({
          clerkId: u.id,
          email: u.emailAddresses?.[0]?.emailAddress || "",
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim()
        })
        .returning()
      dbUser = inserted
    }
    const existingMembership = await db.query.orgMembers.findFirst({
      where: and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, dbUser.id))
    })
    if (!existingMembership) {
      await db
        .insert(orgMembers)
        .values({ orgId, userId: dbUser.id, role: "ADMIN" })
    }
  }

  const members = await db
    .select({
      id: orgMembers.id,
      role: orgMembers.role,
      name: users.name,
      email: users.email,
      clerkId: users.clerkId
    })
    .from(orgMembers)
    .leftJoin(users, eq(users.id, orgMembers.userId))
    .where(eq(orgMembers.orgId, orgId))

  const clerkIds = [
    ...new Set(members.map(m => m.clerkId).filter(Boolean))
  ] as string[]
  const clerkUsers = clerkIds.length
    ? Array(
        ...(await (await clerkClient()).users.getUserList({ userId: clerkIds }))
          .data
      )
    : []

  const idToClerk = clerkUsers.length
    ? new Map(clerkUsers.map(u => [u.id, u]))
    : new Map()

  const rows = members.map(m => {
    const cu = m.clerkId ? idToClerk.get(m.clerkId) : undefined
    const lastLoginAt: string | null =
      cu?.lastSignInAt || cu?.lastActiveAt || null
    let status: "active" | "invite pending" | "inactive" = "active"
    if (!cu) status = "invite pending"
    else if (!lastLoginAt) status = "inactive"
    return { ...m, status, lastLoginAt }
  })

  function initials(name?: string | null) {
    if (!name) return "?"
    const parts = name.trim().split(/\s+/)
    const a = parts[0]?.[0] || ""
    const b = parts.length > 1 ? parts[parts.length - 1][0] : ""
    return (a + b).toUpperCase()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Members</h1>
        <NewMemberButton />
      </div>
      <div className="rounded border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Member</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Permissions</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Last login</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(m => (
              <tr key={m.id} className="border-t">
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{initials(m.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      <span>{m.name || "-"}</span>
                      {m.role === "ADMIN" && (
                        <Badge variant="default">Admin</Badge>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-2">{m.email}</td>
                <td className="p-2">
                  {m.role === "ADMIN"
                    ? "Admin"
                    : m.role === "HANDLER"
                      ? "Handler"
                      : "Auditor"}
                </td>
                <td className="p-2 capitalize">{m.status}</td>
                <td className="p-2">
                  {m.lastLoginAt
                    ? new Date(m.lastLoginAt).toLocaleString()
                    : "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="text-muted-foreground p-4" colSpan={5}>
                  No members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
