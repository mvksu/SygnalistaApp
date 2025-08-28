import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { reportViews } from "@/db/schema/reportViews"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.insert(reportViews).values({ reportId: id })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
