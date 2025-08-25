import { NextRequest, NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { db } from "@/db"
import { users } from "@/db/schema/users"
import { orgMembers } from "@/db/schema/orgMembers"
import { and, eq } from "drizzle-orm"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { orgId: clerkOrgId, userId } = await auth()
    if (!clerkOrgId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
    const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
    const body = await req.json()
    const firstName = String(body?.firstName || "").trim()
    const lastName = String(body?.lastName || "").trim()
    const phone = String(body?.phone || "").trim()

    // Check requester is ADMIN
    const requester = await db.query.users.findFirst({ where: eq(users.clerkId, userId) })
    if (!requester) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const membership = await db.query.orgMembers.findFirst({ where: and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, requester.id)) })
    if (!membership || membership.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Target member
    const target = await db.query.orgMembers.findFirst({ where: and(eq(orgMembers.id, params.id), eq(orgMembers.orgId, orgId)) })
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const targetUser = await db.query.users.findFirst({ where: eq(users.id, target.userId) })
    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Update local name
    if (firstName || lastName) {
      const newName = `${firstName} ${lastName}`.trim()
      await db.update(users).set({ name: newName }).where(eq(users.id, targetUser.id))
    }

    // Update Clerk profile if available
    if (targetUser.clerkId) {
      const cc = await clerkClient()
      try {
        const updates: Record<string, any> = {}
        if (firstName) updates.firstName = firstName
        if (lastName) updates.lastName = lastName
        if (phone) updates.phoneNumber = phone
        if (Object.keys(updates).length > 0) {
          await cc.users.updateUser(targetUser.clerkId, updates as any)
        }
      } catch (e: unknown) {
        // non-fatal; return warning
        return NextResponse.json({ ok: true, warning: "Saved locally; Clerk update failed" })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 })
  }
}



