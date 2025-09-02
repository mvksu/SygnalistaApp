import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { exportReports } from "@/src/server/services/exports"

export async function GET(request: NextRequest) {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return NextResponse.json({ error: "no org" }, { status: 400 })
  const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
  const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
  const url = new URL(request.url)
  const fmt = url.searchParams.get("format") === "pdf" ? "pdf" : "json"
  const { content, filename } = await exportReports(orgId, fmt)
  return new NextResponse(content, {
    headers: {
      "content-type": fmt === "pdf" ? "application/pdf" : "application/json",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  })
}
