import { NextRequest, NextResponse } from "next/server"
import { assertRoleInOrg, assertCanAccessReport } from "@/lib/authz"
import { addHandlerMessage } from "@/src/server/services/reports"
import {
  writeAudit,
  getAuditFingerprint,
  getCurrentActorOrgMemberId
} from "@/src/server/services/audit"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, orgId, role } = await assertRoleInOrg(["ADMIN", "HANDLER"]) 
    const { id: reportId } = await params
    await assertCanAccessReport({ orgId, userId, role, reportId })
    const { body } = await request.json()
    if (!body && body !== "") return NextResponse.json({ error: "Missing body" }, { status: 400 })
    
    const msg = await addHandlerMessage({ orgId, reportId, body, actorId: userId })
    
    // Audit: REPORT_MESSAGE_ADDED with actor + fingerprint
    try {
      const [{ ipHash, uaHash }, { orgMemberId }] = await Promise.all([
        getAuditFingerprint(request),
        getCurrentActorOrgMemberId()
      ])
      await writeAudit({
        orgId,
        actorId: orgMemberId,
        action: "REPORT_MESSAGE_ADDED",
        targetType: "report",
        targetId: reportId,
        ipHash,
        uaHash
      })
    } catch {}
    
    return NextResponse.json({ ok: true, messageId: msg.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 })
  }
}





