import { NextRequest, NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { db } from "@/db"
import { users } from "@/db/schema/users"
import { orgMembers } from "@/db/schema/orgMembers"
import { and, eq } from "drizzle-orm"

async function getDbOrgId() {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return { clerkOrgId: null as string | null, dbOrgId: null as string | null }
  const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
  const dbOrgId = await getDbOrgIdForClerkOrg(clerkOrgId)
  return { clerkOrgId, dbOrgId }
}

export async function POST(req: NextRequest) {
  try {
    const { clerkOrgId, dbOrgId } = await getDbOrgId()
    if (!clerkOrgId || !dbOrgId) return NextResponse.json({ error: "No organization context" }, { status: 400 })
    const body = await req.json()
    const email = String(body?.email || "").trim()
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

    const cc = await clerkClient()
    const user = (await cc.users.getUserList({ emailAddress: [email] })).data?.[0]
    if (!user) return NextResponse.json({ error: "User not found in Clerk" }, { status: 404 })

    // Remove from Clerk org
    await cc.organizations.deleteOrganizationMembership({ organizationId: clerkOrgId, userId: user.id })

    // Remove from DB
    const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, user.id) })
    if (dbUser) {
      const existing = await db.query.orgMembers.findFirst({ where: and(eq(orgMembers.orgId, dbOrgId), eq(orgMembers.userId, dbUser.id)) })
      if (existing) {
        await db.delete(orgMembers).where(eq(orgMembers.id, existing.id))
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 })
  }
}


