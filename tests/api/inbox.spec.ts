import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest"
import type { Mock } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/captcha", () => ({
  verifyCaptcha: vi.fn(),
}))

vi.mock("@/src/server/services/inbox", () => ({
  verifyReceiptPassphrase: vi.fn(),
  getThreadForReporter: vi.fn(),
  postReporterMessage: vi.fn(),
}))

import { verifyCaptcha } from "@/lib/captcha"
import {
  verifyReceiptPassphrase,
  getThreadForReporter,
  postReporterMessage,
} from "@/src/server/services/inbox"
import {
  GET as getThread,
  POST as postMessage,
} from "@/app/api/inbox/[receipt]/messages/route"
import { POST as authUnlock } from "@/app/api/inbox/[receipt]/auth/route"

describe("Inbox routes - reporter flow", () => {
  const verifyCaptchaMock = verifyCaptcha as unknown as Mock
  const verifyReceiptPassphraseMock = verifyReceiptPassphrase as unknown as Mock
  const getThreadForReporterMock = getThreadForReporter as unknown as Mock
  const postReporterMessageMock = postReporterMessage as unknown as Mock

  beforeAll(() => {
    process.env.APP_MASTER_KEY = Buffer.from(Array(32).fill(2)).toString("base64")
  })

  beforeEach(() => {
    vi.clearAllMocks()
    verifyCaptchaMock.mockResolvedValue({ success: true })
  })

  it("rejects GET without case key header", async () => {
    const req = new NextRequest("http://localhost/api/inbox/RCPT/messages") as any
    const res = await getThread(req, { params: { receipt: "RCPT" } })
    const json = await res.json()
    expect(res.status).toBe(401)
    expect(json.error).toContain("case key")
  })

  it("requires case key for posting", async () => {
    const req = new NextRequest("http://localhost/api/inbox/RCPT/messages", {
      method: "POST",
      body: JSON.stringify({ body: "hi", captchaToken: "ok" }),
      headers: { "content-type": "application/json" },
    }) as any
    const res = await postMessage(req, { params: { receipt: "RCPT" } })
    expect(res.status).toBe(400)
  })

  it("authUnlock succeeds with valid key", async () => {
    verifyReceiptPassphraseMock.mockResolvedValueOnce({ id: "r1" })
    const req = new NextRequest("http://localhost/api/inbox/RCPT/auth", {
      method: "POST",
      body: JSON.stringify({ caseKey: "secret", captchaToken: "tok" }),
      headers: { "content-type": "application/json" },
    }) as any
    const res = await authUnlock(req, { params: Promise.resolve({ receipt: "RCPT" }) } as any)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(verifyReceiptPassphraseMock).toHaveBeenCalledWith("RCPT", "secret")
  })

  it("authUnlock fails with invalid key", async () => {
    verifyReceiptPassphraseMock.mockResolvedValueOnce(null)
    const req = new NextRequest("http://localhost/api/inbox/RCPT/auth", {
      method: "POST",
      body: JSON.stringify({ caseKey: "wrong", captchaToken: "tok" }),
      headers: { "content-type": "application/json" },
    }) as any
    const res = await authUnlock(req, { params: Promise.resolve({ receipt: "RCPT" }) } as any)
    expect(res.status).toBe(401)
  })

  it("authUnlock fails captcha", async () => {
    verifyCaptchaMock.mockResolvedValueOnce({ success: false })
    const req = new NextRequest("http://localhost/api/inbox/RCPT/auth", {
      method: "POST",
      body: JSON.stringify({ caseKey: "secret", captchaToken: "tok" }),
      headers: { "content-type": "application/json" },
    }) as any
    const res = await authUnlock(req, { params: Promise.resolve({ receipt: "RCPT" }) } as any)
    expect(res.status).toBe(400)
  })

  it("getThread returns thread data", async () => {
    const thread = {
      report: {
        id: "r1",
        caseId: "CASE-1",
        reporterMode: "ANON",
        categoryId: "cat",
        categoryName: "Category",
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      },
      messages: [],
      attachments: [],
    }
    getThreadForReporterMock.mockResolvedValueOnce(thread)
    const req = new NextRequest("http://localhost/api/inbox/RCPT/messages", {
      headers: { "x-passphrase": "key" },
    }) as any
    const res = await getThread(req, { params: { receipt: "RCPT" } })
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.report.caseId).toBe("CASE-1")
  })

  it("getThread rejects invalid key", async () => {
    getThreadForReporterMock.mockResolvedValueOnce(null)
    const req = new NextRequest("http://localhost/api/inbox/RCPT/messages", {
      headers: { "x-passphrase": "bad" },
    }) as any
    const res = await getThread(req, { params: { receipt: "RCPT" } })
    expect(res.status).toBe(401)
  })

  it("postMessage rejects on captcha failure", async () => {
    verifyCaptchaMock.mockResolvedValueOnce({ success: false })
    const req = new NextRequest("http://localhost/api/inbox/RCPT/messages", {
      method: "POST",
      body: JSON.stringify({ passphrase: "key", body: "hi", captchaToken: "bad" }),
      headers: { "content-type": "application/json" },
    }) as any
    const res = await postMessage(req, { params: { receipt: "RCPT" } })
    expect(res.status).toBe(400)
  })

  it("postMessage rejects with invalid key", async () => {
    postReporterMessageMock.mockResolvedValueOnce(null)
    const req = new NextRequest("http://localhost/api/inbox/RCPT/messages", {
      method: "POST",
      body: JSON.stringify({ passphrase: "bad", body: "hello", captchaToken: "tok" }),
      headers: { "content-type": "application/json" },
    }) as any
    const res = await postMessage(req, { params: { receipt: "RCPT" } })
    expect(res.status).toBe(401)
  })

  it("postMessage sends message with attachments", async () => {
    postReporterMessageMock.mockResolvedValueOnce({ messageId: "m1" })
    const attachments = [
      { storageKey: "s", filename: "f.txt", size: 1, contentHash: "h" },
    ]
    const req = new NextRequest("http://localhost/api/inbox/RCPT/messages", {
      method: "POST",
      body: JSON.stringify({
        passphrase: "key",
        body: "hello",
        captchaToken: "tok",
        attachments,
      }),
      headers: { "content-type": "application/json" },
    }) as any
    const res = await postMessage(req, { params: { receipt: "RCPT" } })
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.messageId).toBe("m1")
    expect(postReporterMessageMock).toHaveBeenCalledWith("RCPT", "key", "hello", attachments)
  })
})

