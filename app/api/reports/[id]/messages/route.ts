import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { addHandlerMessage } from "@/src/server/services/reports"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, orgId } = await auth()
    if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const reportId = params.id
    const { body } = await request.json()
    if (!body) return NextResponse.json({ error: "Missing body" }, { status: 400 })
    await addHandlerMessage({ orgId, reportId, body, actorId: userId })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}





