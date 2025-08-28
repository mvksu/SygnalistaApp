import { NextRequest, NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { db } from "@/db"
import { users } from "@/db/schema/users"
import { orgMembers } from "@/db/schema/orgMembers"
import { and, eq } from "drizzle-orm"
import { writeAudit, getAuditFingerprint } from "@/src/server/services/audit"

async function getDbOrgId() {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return { clerkOrgId: null as string | null, dbOrgId: null as string | null }
  const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
  const dbOrgId = await getDbOrgIdForClerkOrg(clerkOrgId)
  return { clerkOrgId, dbOrgId }
}

export async function PATCH(req: NextRequest) {
  try {
    const { clerkOrgId, dbOrgId } = await getDbOrgId()
    if (!clerkOrgId || !dbOrgId) return NextResponse.json({ error: "No organization context" }, { status: 400 })
    const body = await req.json()
    const email = String(body?.email || "").trim()
    const role = (String(body?.role || "HANDLER").toUpperCase() as "ADMIN" | "HANDLER" | "AUDITOR")
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

    const cc = clerkClient
    const user = (await cc.users.getUserList({ emailAddress: [email] })).data?.[0]
    if (!user) return NextResponse.json({ error: "User not found in Clerk" }, { status: 404 })

    await cc.organizations.updateOrganizationMembership({ organizationId: clerkOrgId, userId: user.id, role: role.toLowerCase() as any })

    // Mirror in DB
    let dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, user.id) })
    if (!dbUser) {
      const [inserted] = await db.insert(users).values({ clerkId: user.id, email, name: `${user.firstName || ""} ${user.lastName || ""}`.trim() }).returning()
      dbUser = inserted
    }
    const existing = await db.query.orgMembers.findFirst({ where: and(eq(orgMembers.orgId, dbOrgId), eq(orgMembers.userId, dbUser.id)) })
    if (existing) {
      await db.update(orgMembers).set({ role }).where(eq(orgMembers.id, existing.id))
    } else {
      await db.insert(orgMembers).values({ orgId: dbOrgId, userId: dbUser.id, role })
    }

    const { ipHash, uaHash } = await getAuditFingerprint(req)
    await writeAudit({ orgId: dbOrgId, actorId: null, action: "MEMBER_ROLE_UPDATED", targetType: "member", targetId: dbUser.id, ipHash, uaHash })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 })
  }
}



