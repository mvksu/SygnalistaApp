import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createSurvey, listSurveys } from "@/src/server/services/surveys"

export async function GET() {
  try {
    const { orgId: clerkOrgId } = await auth()
    if (!clerkOrgId) return NextResponse.json([], { status: 200 })
    const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
    const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
    const surveys = await listSurveys(orgId)
    return NextResponse.json(surveys, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to list" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { orgId: clerkOrgId } = await auth()
    if (!clerkOrgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
    const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)

    const body = await request.json()
    const title: string = String(body?.title || "").trim()
    const description: string | undefined = body?.description?.trim?.() || undefined
    const questions: Array<{ text: string; options: string[] }> = Array.isArray(body?.questions) ? body.questions : []

    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 })
    if (questions.length === 0) return NextResponse.json({ error: "At least one question" }, { status: 400 })

    const survey = await createSurvey(orgId, { title, description, questions })
    return NextResponse.json(survey, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create" }, { status: 500 })
  }
}


