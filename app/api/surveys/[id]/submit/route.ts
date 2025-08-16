import { NextRequest, NextResponse } from "next/server"
import { submitSurveyAnswers } from "@/src/server/services/surveys"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const answers = Array.isArray(body?.answers) ? body.answers : []
    await submitSurveyAnswers(params.id, answers)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to submit" }, { status: 500 })
  }
}


