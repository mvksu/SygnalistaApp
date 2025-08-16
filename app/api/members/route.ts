import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "@/db"
import { users } from "@/db/schema/users"
import { orgMembers } from "@/db/schema/orgMembers"
import { eq } from "drizzle-orm"
import { getDbOrgIdForClerkOrg } from "@/src/server/orgs"

export async function GET() {
  try {
    const { orgId: clerkOrgId } = await auth()
    if (!clerkOrgId) return NextResponse.json([], { status: 200 })
    const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
    const members = await db
      .select({ id: orgMembers.id, role: orgMembers.role, name: users.name, email: users.email })
      .from(orgMembers)
      .leftJoin(users, eq(users.id, orgMembers.userId))
      .where(eq(orgMembers.orgId, orgId))
    return NextResponse.json(members)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { orgId: clerkOrgId } = await auth()
    if (!clerkOrgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)

    const body = await req.json()
    const firstName: string = String(body?.firstName || "").trim()
    const lastName: string = String(body?.lastName || "").trim()
    const email: string = String(body?.email || "").trim()
    const role: "ADMIN" | "HANDLER" | "AUDITOR" = body?.role || "HANDLER"
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

    let u = await db.query.users.findFirst({ where: eq(users.email, email) })
    if (!u) {
      const [newUser] = await db
        .insert(users)
        .values({ clerkId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, email, name: `${firstName} ${lastName}`.trim() })
        .returning()
      u = newUser
    }

    await db.insert(orgMembers).values({ orgId, userId: u.id, role })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "@/db"
import { users } from "@/db/schema/users"
import { orgMembers } from "@/db/schema/orgMembers"
import { eq } from "drizzle-orm"

async function getDbOrgId() {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return null
  const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
  return getDbOrgIdForClerkOrg(clerkOrgId)
}

export async function POST(req: NextRequest) {
  try {
    const orgId = await getDbOrgId()
    if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 })
    const body = await req.json()
    const first = String(body?.firstName || "").trim()
    const last = String(body?.lastName || "").trim()
    const email = String(body?.email || "").trim()
    const role = String(body?.role || "HANDLER").toUpperCase()
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

    let userRow = await db.query.users.findFirst({ where: eq(users.email, email) })
    if (!userRow) {
      const [inserted] = await db.insert(users).values({ email, name: `${first} ${last}`.trim(), clerkId: `${email}:${Date.now()}` }).returning()
      userRow = inserted
    }

    await db.insert(orgMembers).values({ orgId, userId: userRow.id, role: role as any })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const orgId = await getDbOrgId()
    if (!orgId) return NextResponse.json([], { status: 200 })
    const rows = await db.query.orgMembers.findMany({ where: eq(orgMembers.orgId, orgId) })
    return NextResponse.json(rows, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 })
  }
}


