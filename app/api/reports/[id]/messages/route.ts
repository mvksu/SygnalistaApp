import { NextRequest, NextResponse } from "next/server"
import { assertRoleInOrg, assertCanAccessReport } from "@/lib/authz"
import { addHandlerMessage } from "@/src/server/services/reports"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, orgId, role } = await assertRoleInOrg(["ADMIN", "HANDLER"]) 
    const { id: reportId } = await params
    await assertCanAccessReport({ orgId, userId, role, reportId })
    const { body } = await request.json()
    if (!body) return NextResponse.json({ error: "Missing body" }, { status: 400 })
    await addHandlerMessage({ orgId, reportId, body, actorId: userId })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 })
  }
}





