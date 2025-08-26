import { NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema/users"
import { orgMembers } from "@/db/schema/orgMembers"
import { eq, and } from "drizzle-orm"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getDbOrgIdForClerkOrg } from "@/src/server/orgs"

export async function GET() {
  try {
    const { userId: clerkUserId, orgId: clerkOrgId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
    if (!clerkOrgId) return NextResponse.json({ error: "no_organization" }, { status: 400 })

    let dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, clerkUserId) })
    if (!dbUser) {
      // auto-provision user record if missing
      const cu = await currentUser().catch(() => null)
      const email = cu?.emailAddresses?.[0]?.emailAddress || ""
      const name = `${cu?.firstName || ""} ${cu?.lastName || ""}`.trim()
      const [inserted] = await db.insert(users).values({ clerkId: clerkUserId, email, name }).returning()
      dbUser = inserted
    }

    const dbOrgId = await getDbOrgIdForClerkOrg(clerkOrgId)
    const member = await db.query.orgMembers.findFirst({ where: and(eq(orgMembers.userId, dbUser.id), eq(orgMembers.orgId, dbOrgId)) })
    if (!member) return NextResponse.json({ error: "not_member" }, { status: 403 })
    return NextResponse.json({ role: "ADMIN" })
  } catch (_e) {
    return NextResponse.json({ error: "unknown" }, { status: 500 })
  }
}


