import { NextRequest, NextResponse } from "next/server"
import { assertRoleInOrg, assertCanAccessReport } from "@/lib/authz"
import { acknowledgeReport } from "@/src/server/services/reports"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, orgId, role } = await assertRoleInOrg(["ADMIN", "HANDLER"]) 
    const reportId = params.id
    await assertCanAccessReport({ orgId, userId, role, reportId })
    await acknowledgeReport({ orgId, reportId, actorId: userId })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}





