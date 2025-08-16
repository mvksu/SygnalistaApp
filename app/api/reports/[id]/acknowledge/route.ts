import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { acknowledgeReport } from "@/src/server/services/reports"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, orgId } = await auth()
    if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const reportId = params.id
    await acknowledgeReport({ orgId, reportId, actorId: userId })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}





