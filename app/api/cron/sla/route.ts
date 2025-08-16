import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { computeAndMarkSla } from "@/src/server/services/sla"

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-cron-secret") || ""
    if (secret !== (process.env.CRON_SECRET || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { orgId: clerkOrgId } = await auth()
    if (!clerkOrgId) return NextResponse.json({ error: "No org context" }, { status: 400 })
    const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
    const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
    const res = await computeAndMarkSla(orgId)
    return NextResponse.json({ ok: true, ...res })
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


