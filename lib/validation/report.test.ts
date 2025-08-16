import { describe, it, expect } from "vitest"
import { reportIntakeSchema, reporterContactSchema } from "./report"

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


