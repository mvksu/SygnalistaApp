import { NextRequest, NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { db } from "@/db"
import { users } from "@/db/schema/users"
import { orgMembers } from "@/db/schema/orgMembers"
import { and, eq } from "drizzle-orm"

async function getDbOrgId() {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return null
  const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
  return getDbOrgIdForClerkOrg(clerkOrgId)
}

export async function POST(req: NextRequest) {
  try {
    const { orgId: clerkOrgId } = await auth()
    if (!clerkOrgId)
      return NextResponse.json(
        { error: "No Clerk organization context", code: "no_org_context" },
        { status: 400 }
      )
    const orgId = await getDbOrgId()
    if (!orgId)
      return NextResponse.json(
        { error: "Organization not found", code: "org_not_found" },
        { status: 400 }
      )

    const body = await req.json()
    const first = String(body?.firstName || "").trim()
    const last = String(body?.lastName || "").trim()
    const email = String(body?.email || "").trim()
    const role = String(body?.role || "HANDLER").toUpperCase() as
      | "ADMIN"
      | "HANDLER"
      | "AUDITOR"
    if (!email)
      return NextResponse.json(
        { error: "Email required", code: "email_required" },
        { status: 400 }
      )
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json(
        { error: "Invalid email format", code: "invalid_email" },
        { status: 400 }
      )
    if (!["ADMIN", "HANDLER", "AUDITOR"].includes(role))
      return NextResponse.json(
        { error: "Invalid role", code: "invalid_role" },
        { status: 400 }
      )

    // 1) Ensure a real Clerk user exists (create+invite if not)
    const getErrorMessage = (err: unknown) =>
      err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err)

    const cc = await clerkClient()
    try {
      await cc.organizations.getOrganizationList({ limit: 1 })
    } catch (err: unknown) {
      console.error("[members.POST] clerkClient init failed", err)
      return NextResponse.json(
        { error: "Auth provider unavailable", code: "clerk_unavailable" },
        { status: 502 }
      )
    }

    let existing
    try {
      existing = (await cc.users.getUserList({ emailAddress: [email] })).data?.[0]
    } catch (err: unknown) {
      console.error("[members.POST] getUserList failed", err)
      return NextResponse.json(
        { error: "Failed to lookup user", code: "clerk_lookup_failed" },
        { status: 502 }
      )
    }
    const clerkUserId = existing?.id as string | undefined

    // 2) Ensure Clerk org exists, then create membership with requested role
    const parseClerkError = (err: unknown) => {
      const anyErr = err as { status?: number; clerkTraceId?: string; errors?: unknown }
      return {
        status: anyErr?.status,
        traceId: anyErr?.clerkTraceId,
        errors: anyErr?.errors
      }
    }

    try {
      await cc.organizations.getOrganization({ organizationId: clerkOrgId })
    } catch (err: unknown) {
      const details = parseClerkError(err)
      console.error("[members.POST] getOrganization failed", err)
      return NextResponse.json(
        { error: "Clerk organization not found", code: "clerk_org_not_found", details },
        { status: 404 }
      )
    }

    // Clerk default roles: 'admin' and 'basic_member'
    const clerkRole: "admin" | "basic_member" = role === "ADMIN" ? "admin" : "basic_member"

    // If user does not exist yet, send an org invitation instead of creating a user
    if (!clerkUserId) {
      try {
        await cc.organizations.createOrganizationInvitation({
          organizationId: clerkOrgId,
          emailAddress: email,
          role: clerkRole
        })
      } catch (err: unknown) {
        // Fallback: send a global account invitation (no org) so user can accept and be added later
        console.warn("[members.POST] org invitation failed; trying account invitation fallback")
        try {
          await cc.invitations.createInvitation({ emailAddress: email, notify: true, ignoreExisting: true })
          return NextResponse.json({ invited: true, fallback: "account" }, { status: 202 })
        } catch (inviteErr: unknown) {
          const details = parseClerkError(inviteErr)
          console.error("[members.POST] account invitation fallback failed", inviteErr)
          return NextResponse.json(
            { error: "Failed to invite user", code: "clerk_invite_failed", details },
            { status: 502 }
          )
        }
      }
      // Invitation sent; do not mirror to DB yet since no membership exists
      return NextResponse.json({ invited: true }, { status: 202 })
    }

    // Existing user → ensure membership; on 404 fallback to invitation
    try {
      await cc.organizations.createOrganizationMembership({
        organizationId: clerkOrgId,
        userId: clerkUserId,
        role: clerkRole
      })
    } catch (err: unknown) {
      const message = String(getErrorMessage(err) || "").toLowerCase()
      const status = (err as { status?: number })?.status
      if (message.includes("already")) {
        // continue
      } else if (status === 404) {
        try {
          await cc.organizations.createOrganizationInvitation({
            organizationId: clerkOrgId,
            emailAddress: email,
            role: clerkRole
          })
          return NextResponse.json({ invited: true }, { status: 202 })
        } catch (inviteErr: unknown) {
          console.warn("[members.POST] org invite fallback failed; trying account invitation")
          try {
            await cc.invitations.createInvitation({ emailAddress: email, notify: true, ignoreExisting: true })
            return NextResponse.json({ invited: true, fallback: "account" }, { status: 202 })
          } catch (secondErr: unknown) {
            const details = parseClerkError(secondErr)
            console.error("[members.POST] account invitation fallback failed", secondErr)
            return NextResponse.json(
              { error: "Failed to invite user", code: "clerk_invite_failed", details },
              { status: 502 }
            )
          }
        }
      } else {
        const details = parseClerkError(err)
        console.error("[members.POST] createOrganizationMembership failed", err)
        return NextResponse.json(
          { error: "Failed to add user to organization", code: "clerk_membership_failed", details },
          { status: 502 }
        )
      }
    }

    // 3) Mirror to our DB: upsert user by clerkId/email, then upsert orgMembers
    let dbUser
    try {
      dbUser = await db.query.users.findFirst({
        where: eq(users.clerkId, clerkUserId!)
      })
    } catch (err: unknown) {
      console.error("[members.POST] DB lookup user by clerkId failed", err)
      return NextResponse.json(
        { error: "Database error", code: "db_lookup_failed" },
        { status: 500 }
      )
    }
    if (!dbUser) {
      try {
        dbUser = await db.transaction(async tx => {
          const existingByEmail = await tx.query.users.findFirst({
            where: eq(users.email, email)
          })
          if (existingByEmail) {
            await tx
              .update(users)
              .set({
                clerkId: clerkUserId!,
                name: `${first} ${last}`.trim() || existingByEmail.name
              })
              .where(eq(users.id, existingByEmail.id))
            return (await tx.query.users.findFirst({
              where: eq(users.id, existingByEmail.id)
            }))!
          }
          const [inserted] = await tx
            .insert(users)
            .values({
              clerkId: clerkUserId!,
              email,
              name: `${first} ${last}`.trim()
            })
            .returning()
          return inserted
        })
      } catch (err: unknown) {
        console.error("[members.POST] DB upsert user failed", err)
        return NextResponse.json(
          { error: "Database error", code: "db_upsert_user_failed" },
          { status: 500 }
        )
      }
    }

    try {
      const already = await db.query.orgMembers.findFirst({
        where: and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, dbUser.id))
      })
      if (!already) {
        await db.insert(orgMembers).values({ orgId, userId: dbUser.id, role })
      } else if (already.role !== role) {
        await db
          .update(orgMembers)
          .set({ role })
          .where(eq(orgMembers.id, already.id))
      }
    } catch (err: unknown) {
      console.error("[members.POST] DB upsert orgMembers failed", err)
      return NextResponse.json(
        { error: "Database error", code: "db_upsert_membership_failed" },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    console.error("[members.POST] unexpected error", e)
    return NextResponse.json(
      { error: (e instanceof Error ? e.message : "Failed"), code: "unexpected_error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const orgId = await getDbOrgId()
    if (!orgId) return NextResponse.json([], { status: 200 })
    const rows = await db
      .select({
        orgMemberId: orgMembers.id,
        userId: users.id,
        role: orgMembers.role,
        name: users.name,
        email: users.email
      })
      .from(orgMembers)
      .innerJoin(users, eq(users.id, orgMembers.userId))
      .where(eq(orgMembers.orgId, orgId))
    return NextResponse.json(rows, { status: 200 })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
