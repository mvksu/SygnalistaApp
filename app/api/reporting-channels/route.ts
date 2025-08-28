import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { reportingChannels } from "@/db/schema/reportingChannels"
import { getDbOrgIdForClerkOrg } from "@/src/server/orgs"
import { eq, and } from "drizzle-orm"
import { writeAudit, getAuditFingerprint } from "@/src/server/services/audit"

export async function GET() {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return NextResponse.json([], { status: 200 })
  const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
  const rows = await db.select().from(reportingChannels).where(eq(reportingChannels.orgId, orgId))
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
  const body = await req.json().catch(() => null)
  const name = String(body?.name || "").trim()
  const slug = String(body?.slug || "").trim()
  const type = String(body?.type || "links") as any
  const defaultLanguage = String(body?.defaultLanguage || "auto")
  if (!name || !slug) return NextResponse.json({ error: "name and slug required" }, { status: 400 })
  const [row] = await db
    .insert(reportingChannels)
    .values({ orgId, name, slug, type, defaultLanguage })
    .returning()
  const { ipHash, uaHash } = await getAuditFingerprint(req)
  await writeAudit({ orgId, actorId: null, action: "CHANNEL_CREATED", targetType: "channel", targetId: row.id, ipHash, uaHash })
  return NextResponse.json(row)
}

export async function PATCH(req: NextRequest) {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
  const body = await req.json().catch(() => null)
  const id = String(body?.id || "").trim()
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const patch: Record<string, unknown> = {}
  if (body?.name) patch.name = String(body.name)
  if (body?.slug) patch.slug = String(body.slug)
  if (body?.type) patch.type = String(body.type)
  if (body?.defaultLanguage) patch.defaultLanguage = String(body.defaultLanguage)
  const [row] = await db
    .update(reportingChannels)
    .set(patch)
    .where(and(eq(reportingChannels.orgId, orgId), eq(reportingChannels.id, id)))
    .returning()
  const { ipHash, uaHash } = await getAuditFingerprint(req)
  await writeAudit({ orgId, actorId: null, action: "CHANNEL_UPDATED", targetType: "channel", targetId: id, ipHash, uaHash })
  return NextResponse.json(row)
}

export async function DELETE(req: NextRequest) {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
  const body = await req.json().catch(() => null)
  const id = String(body?.id || "").trim()
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await db.delete(reportingChannels).where(and(eq(reportingChannels.orgId, orgId), eq(reportingChannels.id, id)))
  const { ipHash, uaHash } = await getAuditFingerprint(req)
  await writeAudit({ orgId, actorId: null, action: "CHANNEL_DELETED", targetType: "channel", targetId: id, ipHash, uaHash })
  return NextResponse.json({ ok: true })
}


