import { describe, expect, it, vi, beforeEach } from "vitest"
import { verifyCaptcha, verifyRecaptchaV3 } from "./captcha"

// Mock fetch
const globalAny: any = global

describe("captcha", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("bypasses when CAPTCHA_DISABLED=true", async () => {
    globalAny.process = { env: { CAPTCHA_DISABLED: "true" } }
    const res = await verifyCaptcha("token")
    expect(res.success).toBe(true)
  })

  it("recaptcha v3 verifies success with score and action", async () => {
    globalAny.process = { env: { RECAPTCHA_SECRET_KEY: "s" } }
    globalAny.fetch = vi.fn(async () => ({
      json: async () => ({ success: true, action: "report_submit", score: 0.9 })
    }))
    const res = await verifyRecaptchaV3("tok", "1.1.1.1", { expectedAction: "report_submit", minScore: 0.3 })
    expect(res.success).toBe(true)
  })

  it("recaptcha v3 fails on low score", async () => {
    globalAny.process = { env: { RECAPTCHA_SECRET_KEY: "s" } }
    globalAny.fetch = vi.fn(async () => ({
      json: async () => ({ success: true, action: "report_submit", score: 0.1 })
    }))
    const res = await verifyRecaptchaV3("tok", undefined, { expectedAction: "report_submit", minScore: 0.3 })
    expect(res.success).toBe(false)
  })
})


