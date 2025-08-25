import { describe, expect, it } from "vitest"
import { reportIntakeSchema, reporterContactSchema } from "./report"

describe("reportIntakeSchema", () => {
  it("accepts minimal valid payload", () => {
    const valid = {
      categoryId: "cat",
      body: "x".repeat(20),
      anonymous: true,
      attachments: [],
      captchaToken: "tok"
    }
    const res = reportIntakeSchema.safeParse(valid)
    expect(res.success).toBe(true)
  })

  it("rejects short body", () => {
    const bad = {
      categoryId: "cat",
      body: "short",
      anonymous: true,
      attachments: [],
      captchaToken: "tok"
    }
    const res = reportIntakeSchema.safeParse(bad)
    expect(res.success).toBe(false)
  })
})


describe("validation/report", () => {
	it("accepts minimal anonymous intake with captcha", () => {
		const data = {
			categoryId: "cat-1",
			body: "This is a sufficiently long message with more than 20 characters.",
			anonymous: true,
			attachments: [],
			captchaToken: "token",
		}
		const parsed = reportIntakeSchema.safeParse(data)
		expect(parsed.success).toBe(true)
	})

	it("rejects too-short body", () => {
		const data = {
			categoryId: "cat-1",
			body: "Too short",
			anonymous: true,
			attachments: [],
			captchaToken: "token",
		}
		const parsed = reportIntakeSchema.safeParse(data)
		expect(parsed.success).toBe(false)
	})

	it("validates optional contact shape", () => {
		const c = reporterContactSchema.safeParse({ email: "user@example.com" })
		expect(c.success).toBe(true)
		const bad = reporterContactSchema.safeParse({ email: "nope" })
		expect(bad.success).toBe(false)
	})
})


