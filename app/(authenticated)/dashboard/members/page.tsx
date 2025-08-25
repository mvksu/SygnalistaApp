import { auth, currentUser, clerkClient } from "@clerk/nextjs/server"
import Link from "next/link"
import { db } from "@/db"
import { orgMembers } from "@/db/schema/orgMembers"
import { users } from "@/db/schema/users"
import { and, eq } from "drizzle-orm"
import NewMemberButton from "./new-member-button"
import DeleteMemberButton from "./delete-member-button"
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

  const cc = await clerkClient()

  // Existing DB members → base rows
  const rows = members.map(m => ({
    ...m,
    status: "active" as const,
    lastLoginAt: null as string | null
  }))

  // Pending invitations from Clerk (not yet members)
  const orgInvites = (
    await cc.organizations.getOrganizationInvitationList({
      organizationId: clerkOrgId,
      status: ["pending"] as unknown as ("pending" | "accepted" | "revoked")[]
    })
  ).data
  const generalInvites = (
    await cc.invitations.getInvitationList({ status: "pending", query: "" })
  ).data
  const invites = [...orgInvites, ...generalInvites]
  const existingEmails = new Set(rows.map(r => r.email).filter(Boolean))
  const pendingRows = invites
    .filter(inv => inv.emailAddress && !existingEmails.has(inv.emailAddress))
    .map((inv: { id: string; emailAddress: string; role?: string }) => {
      const role = inv.role === "admin" ? "ADMIN" : "HANDLER"
      return {
        id: `inv:${inv.id}`,
        role,
        name: "",
        email: inv.emailAddress,
        clerkId: null as unknown as string,
        status: "pending" as const,
        lastLoginAt: null as string | null
      }
    })

  // Merge
  const allRows = [...rows, ...pendingRows]

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
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allRows.map(m => (
              <tr key={m.id} className="border-t">
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{initials(m.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      {String(m.id).startsWith("inv:") ? (
                        <span>{m.name || "-"}</span>
                      ) : (
                        <Link
                          href={`/dashboard/members/user/${m.id}`}
                          className="hover:underline"
                        >
                          {m.name || "-"}
                        </Link>
                      )}
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
                <td className="p-2 uppercase">{m.status}</td>
                <td className="p-2">
                  {m.lastLoginAt
                    ? new Date(m.lastLoginAt).toLocaleString()
                    : "—"}
                </td>
                <td className="p-2">
                  <DeleteMemberButton
                    email={m.email || ""}
                    canDelete={Boolean(
                      m.email &&
                        u?.emailAddresses?.[0]?.emailAddress?.toLowerCase() !==
                          m.email?.toLowerCase()
                    )}
                  />
                </td>
              </tr>
            ))}
            {allRows.length === 0 && (
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
