import { NextRequest, NextResponse } from "next/server"
import { getSurveyWithQuestions } from "@/src/server/services/surveys"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await getSurveyWithQuestions(params.id)
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch" }, { status: 500 })
  }
}


