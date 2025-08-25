import { auth, clerkClient } from "@clerk/nextjs/server"
import { db } from "@/db"
import { users } from "@/db/schema/users"
import { orgMembers } from "@/db/schema/orgMembers"
import { and, eq } from "drizzle-orm"
import MemberEditor from "./profile-editor"

export default async function MemberUserPage({ params }: { params: { id: string } }) {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return null
  const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
  const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)

  const member = await db
    .select({ id: orgMembers.id, role: orgMembers.role, userId: users.id, name: users.name, email: users.email, clerkId: users.clerkId })
    .from(orgMembers)
    .leftJoin(users, eq(users.id, orgMembers.userId))
    .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.id, params.id)))
    .then(rows => rows[0])

  if (!member) return null

  const cc = await clerkClient()
  const clerkUser = member.clerkId ? await cc.users.getUser(member.clerkId).catch(() => null) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">User settings</h1>
      </div>
      <MemberEditor
        id={member.id}
        name={member.name || ""}
        email={member.email || ""}
        role={member.role}
        phone={clerkUser?.phoneNumbers?.[0]?.phoneNumber || ""}
        clerkId={member.clerkId || ""}
      />
    </div>
  )
}



