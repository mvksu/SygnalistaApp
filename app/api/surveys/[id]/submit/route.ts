import { NextRequest, NextResponse } from "next/server"
import { submitSurveyAnswers } from "@/src/server/services/surveys"
import { writeAudit, getAuditFingerprint, getCurrentActorOrgMemberId } from "@/src/server/services/audit"
import { db } from "@/db"
import { surveys } from "@/db/schema/surveys"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const answers = Array.isArray(body?.answers) ? body.answers : []
    await submitSurveyAnswers(params.id, answers)
    
    try {
      const row = await db.query.surveys.findFirst({ where: eq(surveys.id, params.id) })
      if (row) {
        const [{ ipHash, uaHash }, { orgMemberId }] = await Promise.all([
          getAuditFingerprint(request),
          getCurrentActorOrgMemberId()
        ])
        await writeAudit({
          orgId: row.orgId,
          actorId: orgMemberId,
          action: "SURVEY_SUBMITTED",
          targetType: "survey",
          targetId: params.id,
          ipHash,
          uaHash,
        })
      }
    } catch {}
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to submit" }, { status: 500 })
  }
}


