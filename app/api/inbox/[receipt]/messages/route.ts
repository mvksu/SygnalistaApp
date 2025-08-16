import { NextRequest, NextResponse } from "next/server"
import { getThreadForReporter, postReporterMessage } from "@/src/server/services/inbox"
import { verifyCaptcha } from "@/lib/captcha"

export async function GET(request: NextRequest, { params }: { params: { receipt: string } }) {
  try {
    const receipt = params.receipt
    const passphrase = request.headers.get("x-case-key") || request.headers.get("x-passphrase") || ""
    if (!passphrase) return NextResponse.json({ error: "Missing case key" }, { status: 401 })
    const thread = await getThreadForReporter(receipt, passphrase)
    if (!thread) return NextResponse.json({ error: "Invalid case id or case key" }, { status: 401 })
    return NextResponse.json(thread)
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { receipt: string } }) {
  try {
    const receipt = params.receipt
    const { passphrase, caseKey, body, captchaToken, attachments } = await request.json()
    const key = caseKey || passphrase
    if (!key || !body || !captchaToken) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || undefined
    const captcha = await verifyCaptcha(captchaToken, ip)
    if (!captcha.success) return NextResponse.json({ error: "CAPTCHA failed" }, { status: 400 })

    const posted = await postReporterMessage(receipt, key, body, attachments)
    if (!posted) return NextResponse.json({ error: "Invalid case id or case key" }, { status: 401 })
    return NextResponse.json({ ok: true, messageId: posted.messageId })
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


