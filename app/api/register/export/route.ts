import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

export async function POST(request: NextRequest) {
  try {
    const { orgId: clerkOrgId } = await auth()
    if (!clerkOrgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
    const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)

    const body = await request.json()
    const from = new Date(body?.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1))
    const to = new Date(body?.to || new Date())

    const { exportRegisterCSV } = await import("@/src/server/services/exports")
    const { content, checksum, filename } = await exportRegisterCSV(orgId, { from, to })

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=${filename}`,
        "X-Checksum-SHA256": checksum,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}





