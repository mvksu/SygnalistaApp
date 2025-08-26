import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { reportCategories } from "@/db/schema/reportCategories"
import { reportingChannels } from "@/db/schema/reportingChannels"
import { auth } from "@clerk/nextjs/server"
import { eq, and } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const channelSlug = req.headers.get("x-channel-slug") || url.searchParams.get("channel") || undefined
    let orgId: string | null = null

    if (channelSlug) {
      const channel = await db.query.reportingChannels.findFirst({ where: eq(reportingChannels.slug, channelSlug) })
      if (!channel) {
        return NextResponse.json({ error: "Channel not found" }, { status: 404 })
      }
      orgId = channel.orgId
    } else {
      const orgParam = url.searchParams.get("org")
      if (orgParam) {
        orgId = orgParam
      } else {
        const { orgId: clerkOrgId } = await auth()
        if (clerkOrgId) {
          const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
          orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
        }
      }
    }

    if (!orgId) {
      return NextResponse.json({ error: "Organization context required" }, { status: 400 })
    }

    const rows = await db
      .select({ id: reportCategories.id, name: reportCategories.name })
      .from(reportCategories)
      .where(and(eq(reportCategories.orgId, orgId), eq(reportCategories.active, true)))
      .orderBy(reportCategories.name)

    return NextResponse.json(rows, { status: 200 })
  } catch (err) {
    console.error("[report-categories] GET failed", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

