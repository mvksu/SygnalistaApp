import { NextRequest, NextResponse } from "next/server"
import { buildRateLimitHeaders, getClientIp, rateLimit } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const result = rateLimit({ key: `test:${ip}`, limit: 5, windowMs: 60_000 })
  const headers = buildRateLimitHeaders(result)
  if (!result.allowed) {
    return new NextResponse(JSON.stringify({ error: "Too Many Requests" }), {
      status: 429,
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    })
  }
  return NextResponse.json({ ok: true, ip }, { headers })
}


