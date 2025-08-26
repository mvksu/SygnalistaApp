import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema/users"
import { orgMembers } from "@/db/schema/orgMembers"
import { eq, and } from "drizzle-orm"
import { getDbOrgIdForClerkOrg, createDefaultOrg } from "@/src/server/orgs"

type DbRole = "ADMIN" | "HANDLER" | "AUDITOR"

function mapClerkRoleToDbRole(clerkRole: string | null | undefined): DbRole {
  // Clerk sends 'admin' or 'basic_member' by default. Map basic to HANDLER.
  return clerkRole?.toLowerCase() === "admin" ? "ADMIN" : "HANDLER"
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.CLERK_WEBHOOK_SECRET
    if (!secret) return NextResponse.json({ error: "missing webhook secret" }, { status: 500 })

    const payload = await req.text()
    let type: string = ""
    let data: unknown = {}
    if (secret) {
      const headers = {
        "svix-id": req.headers.get("svix-id") || "",
        "svix-timestamp": req.headers.get("svix-timestamp") || "",
        "svix-signature": req.headers.get("svix-signature") || ""
      }
      try {
        const mod = await import("svix")
        const wh = new mod.Webhook(secret)
        const evt = wh.verify(payload, headers) as unknown as { type?: string; data?: unknown }
        type = evt?.type || ""
        data = evt?.data || {}
      } catch {
        if (process.env.NODE_ENV === "production") {
          return NextResponse.json({ error: "invalid signature" }, { status: 400 })
        }
        // Dev fallback: accept unverified payload to ease local testing
        try {
          const parsed = JSON.parse(payload) as { type?: string; data?: unknown }
          type = parsed.type || ""
          data = parsed.data || {}
        } catch {
          return NextResponse.json({ error: "invalid payload" }, { status: 400 })
        }
      }
    } else {
      // Dev fallback without verification
      try {
        const parsed = JSON.parse(payload) as { type?: string; data?: unknown }
        type = parsed.type || ""
        data = parsed.data || {}
      } catch {
        return NextResponse.json({ error: "invalid payload" }, { status: 400 })
      }
    }
    if (!type) return NextResponse.json({ ok: true })

    if (type === "user.created" || type === "user.updated") {
      type ClerkUserPayload = { id?: string; email_addresses?: { email_address?: string }[]; first_name?: string; last_name?: string }
      const u = data as ClerkUserPayload
      const id: string | undefined = u?.id
      if (id) {
        const existing = await db.query.users.findFirst({ where: eq(users.clerkId, id) })
        const email: string = u?.email_addresses?.[0]?.email_address || existing?.email || ""
        const name: string = `${u?.first_name || ""} ${u?.last_name || ""}`.trim() || existing?.name || ""
        if (existing) {
          await db.update(users).set({ email, name }).where(eq(users.id, existing.id))
        } else {
          await db.insert(users).values({ clerkId: id, email, name })
        }
      }
    }

    if (type === "organization.created") {
      type OrgPayload = { id?: string; name?: string, slug?: string }
      const o = data as OrgPayload
      const clerkOrgId: string | undefined = o?.id
      const clerkOrgName: string | undefined = o?.name
      const clerkOrgSlug: string | undefined = o?.slug
      if (clerkOrgId) {
        await createDefaultOrg(clerkOrgId, clerkOrgName, clerkOrgSlug)
      }
    }

    if (type === "organizationMembership.created" || type === "organizationMembership.updated") {
      type OrgMembershipPayload = { organization?: { id?: string }; public_user_data?: { user_id?: string }; role?: string }
      const m = data as OrgMembershipPayload
      const clerkOrgId: string | undefined = m?.organization?.id
      const clerkUserId: string | undefined = m?.public_user_data?.user_id
      const clerkRole: string | undefined = m?.role
      if (clerkOrgId && clerkUserId) {
        const dbOrgId = await getDbOrgIdForClerkOrg(clerkOrgId)
        const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, clerkUserId) })
        if (dbUser) {
          const dbRole: DbRole = mapClerkRoleToDbRole(clerkRole)
          const existing = await db.query.orgMembers.findFirst({ where: and(eq(orgMembers.orgId, dbOrgId), eq(orgMembers.userId, dbUser.id)) })
          if (existing) {
            await db.update(orgMembers).set({ role: dbRole }).where(eq(orgMembers.id, existing.id))
          } else {
            await db.insert(orgMembers).values({ orgId: dbOrgId, userId: dbUser.id, role: dbRole })
          }
        }
      }
    }

    if (type === "organizationMembership.deleted") {
      type OrgMembershipPayload = { organization?: { id?: string }; public_user_data?: { user_id?: string } }
      const m = data as OrgMembershipPayload
      const clerkOrgId: string | undefined = m?.organization?.id
      const clerkUserId: string | undefined = m?.public_user_data?.user_id
      if (clerkOrgId && clerkUserId) {
        const dbOrgId = await getDbOrgIdForClerkOrg(clerkOrgId)
        const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, clerkUserId) })
        if (dbUser) {
          const existing = await db.query.orgMembers.findFirst({ where: and(eq(orgMembers.orgId, dbOrgId), eq(orgMembers.userId, dbUser.id)) })
          if (existing) await db.delete(orgMembers).where(eq(orgMembers.id, existing.id))
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}



