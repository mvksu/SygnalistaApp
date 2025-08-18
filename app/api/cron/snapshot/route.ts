import { NextRequest, NextResponse } from "next/server"
import { createMonthlySnapshotsForAllOrgs } from "@/src/server/services/exports"

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-cron-secret") || ""
    if (secret !== (process.env.CRON_SECRET || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const res = await createMonthlySnapshotsForAllOrgs()
    return NextResponse.json({ ok: true, ...res })
  } catch (err: unknown) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


