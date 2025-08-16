import { describe, it, expect, beforeAll, vi } from "vitest"
import { GET as getThread, POST as postMessage } from "@/app/api/inbox/[receipt]/messages/route"
import { POST as authUnlock } from "@/app/api/inbox/[receipt]/auth/route"
import { NextRequest } from "next/server"

vi.mock("@/lib/captcha", () => ({
	verifyCaptcha: vi.fn().mockResolvedValue({ success: true }),
}))

describe("Inbox routes", () => {
	beforeAll(() => {
		process.env.APP_MASTER_KEY = Buffer.from(Array(32).fill(2)).toString("base64")
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
})


