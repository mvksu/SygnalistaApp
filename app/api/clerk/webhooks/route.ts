import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema/users"
import { orgMembers } from "@/db/schema/orgMembers"
import { eq, and } from "drizzle-orm"

function verifyClerkSignature(req: NextRequest): boolean {
  // TODO: implement Clerk webhook signature verification if needed
  return true
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyClerkSignature(req)) return NextResponse.json({ error: "invalid signature" }, { status: 401 })
    const body = await req.json()
    const type = body?.type as string
    if (!type) return NextResponse.json({ ok: true })

    if (type === "user.created" || type === "user.updated") {
      const u = body?.data
      if (u?.id) {
        const existing = await db.query.users.findFirst({ where: eq(users.clerkId, u.id) })
        if (existing) {
          await db.update(users).set({ email: u.email_addresses?.[0]?.email_address || existing.email, name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || existing.name }).where(eq(users.id, existing.id))
        } else {
          await db.insert(users).values({ clerkId: u.id, email: u.email_addresses?.[0]?.email_address || "", name: `${u.first_name || ""} ${u.last_name || ""}`.trim() })
        }
      }
    }

    if (type === "organizationMembership.created" || type === "organizationMembership.updated") {
      const m = body?.data
      const clerkOrgId = m?.organization?.id
      const clerkUserId = m?.public_user_data?.user_id
      const role = (m?.role || "member").toString().toUpperCase()
      if (clerkOrgId && clerkUserId) {
        const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
        const dbOrgId = await getDbOrgIdForClerkOrg(clerkOrgId)
        const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, clerkUserId) })
        if (dbUser) {
          const existing = await db.query.orgMembers.findFirst({ where: and(eq(orgMembers.orgId, dbOrgId), eq(orgMembers.userId, dbUser.id)) })
          if (existing) {
            await db.update(orgMembers).set({ role: role as any }).where(eq(orgMembers.id, existing.id))
          } else {
            await db.insert(orgMembers).values({ orgId: dbOrgId, userId: dbUser.id, role: role as any })
          }
        }
      }
    }

    if (type === "organizationMembership.deleted") {
      const m = body?.data
      const clerkOrgId = m?.organization?.id
      const clerkUserId = m?.public_user_data?.user_id
      if (clerkOrgId && clerkUserId) {
        const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
        const dbOrgId = await getDbOrgIdForClerkOrg(clerkOrgId)
        const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, clerkUserId) })
        if (dbUser) {
          const existing = await db.query.orgMembers.findFirst({ where: and(eq(orgMembers.orgId, dbOrgId), eq(orgMembers.userId, dbUser.id)) })
          if (existing) await db.delete(orgMembers).where(eq(orgMembers.id, existing.id))
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 })
  }
}



