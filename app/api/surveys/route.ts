import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createSurvey, listSurveys } from "@/src/server/services/surveys"
import {
  writeAudit,
  getAuditFingerprint,
  getCurrentActorOrgMemberId
} from "@/src/server/services/audit"

export async function GET() {
  try {
    const { orgId: clerkOrgId } = await auth()
    if (!clerkOrgId) return NextResponse.json([], { status: 200 })
    const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
    const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
    const surveys = await listSurveys(orgId)
    return NextResponse.json(surveys, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to list"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { orgId: clerkOrgId } = await auth()
    if (!clerkOrgId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
    const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)

    const raw = (await request.json()) as unknown
    const obj = (typeof raw === "object" && raw !== null) ? (raw as Record<string, unknown>) : {}
    const title: string = typeof obj.title === "string" ? obj.title.trim() : ""
    const description: string | undefined = typeof obj.description === "string" ? obj.description.trim() : undefined
    const rawQuestions: unknown[] = Array.isArray(obj.questions) ? (obj.questions as unknown[]) : []

    if (!title)
      return NextResponse.json({ error: "Title required" }, { status: 400 })

    const questions: Array<{ text: string; options: string[] }> = rawQuestions
      .map((q) => {
        const qobj = (typeof q === "object" && q !== null) ? (q as Record<string, unknown>) : {}
        const text = typeof qobj.text === "string" ? qobj.text.trim() : ""
        const rawOpts: unknown[] = Array.isArray(qobj.options) ? (qobj.options as unknown[]) : []
        const options = rawOpts
          .map((o) => (typeof o === "string" ? o.trim() : ""))
          .filter((s): s is string => Boolean(s))
        return { text, options }
      })
      .filter((q) => q.text && q.options.length > 0)

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "At least one valid question with options is required" },
        { status: 400 }
      )
    }

    const survey = await createSurvey(orgId, { title, description, questions })

    // Audit: SURVEY_CREATED with actor + fingerprint
    try {
      const [{ ipHash, uaHash }, { orgMemberId }] = await Promise.all([
        getAuditFingerprint(request),
        getCurrentActorOrgMemberId()
      ])
      await writeAudit({
        orgId,
        actorId: orgMemberId,
        action: "SURVEY_CREATED",
        targetType: "survey",
        targetId: survey.id,
        ipHash,
        uaHash
      })
    } catch {}

    return NextResponse.json(survey, { status: 201 })
  } catch (err: unknown) {
    console.error("Create survey error", err)
    const message = err instanceof Error ? err.message : "Failed to create"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
