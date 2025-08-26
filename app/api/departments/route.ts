import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { departments } from "@/db/schema/departments"
import { eq } from "drizzle-orm"

export async function GET() {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return NextResponse.json({ error: "no org" }, { status: 400 })
  const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
  const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
  const rows = await db.select().from(departments).where(eq(departments.orgId, orgId))
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return NextResponse.json({ error: "no org" }, { status: 400 })
  const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
  const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
  let name: string | undefined
  let description: string | null | undefined
  const ct = req.headers.get("content-type") || ""
  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => null)
    name = body?.name
    description = body?.description ?? null
  } else if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null)
    name = form?.get("name")?.toString()
    description = form?.get("description")?.toString() ?? null
  }
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })
  const [row] = await db.insert(departments).values({ orgId, name, description: description || null }).returning()
  return NextResponse.json(row)
}


