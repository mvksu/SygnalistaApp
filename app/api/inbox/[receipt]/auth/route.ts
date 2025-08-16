import { NextRequest, NextResponse } from "next/server"
import { verifyCaptcha } from "@/lib/captcha"
import { verifyReceiptPassphrase } from "@/src/server/services/inbox"

export async function POST(request: NextRequest, { params }: { params: { receipt: string } }) {
  try {
    const receipt = params.receipt
    const { passphrase, caseKey, captchaToken } = await request.json()
    const key = caseKey || passphrase
    if (!key || !captchaToken) {
      return NextResponse.json({ error: "Missing case key or captchaToken" }, { status: 400 })
    }
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || undefined
    const captcha = await verifyCaptcha(captchaToken, ip)
    if (!captcha.success) return NextResponse.json({ error: "CAPTCHA failed" }, { status: 400 })

    const report = await verifyReceiptPassphrase(receipt, key)
    if (!report) return NextResponse.json({ error: "Invalid case id or case key" }, { status: 401 })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


