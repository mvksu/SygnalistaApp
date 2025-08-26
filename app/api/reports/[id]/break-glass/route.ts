import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { breakGlassAccess } from "@/src/server/services/access"
import { assertRoleInOrg } from "@/lib/authz"

const Body = z.object({ justification: z.string().min(10) })

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, orgId, role } = await assertRoleInOrg(["ADMIN"]) // optionally gate further
    const reportId = params.id
    const { justification } = Body.parse(await request.json())
    await breakGlassAccess({ orgId, actorId: userId, reportId, justification })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 })
  }
}



