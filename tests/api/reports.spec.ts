import { describe, it, expect, beforeAll, vi } from "vitest"
import { POST as createReport } from "@/app/api/reports/route"
import { NextRequest } from "next/server"
import { db } from "@/db"
import { organizations } from "@/db/schema/organizations"
import { reportCategories } from "@/db/schema/reportCategories"

vi.mock("@/lib/captcha", () => ({
	verifyCaptcha: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock("@clerk/nextjs/server", () => ({
	auth: vi.fn().mockResolvedValue({ orgId: "clerk-org-1" }),
}))

vi.mock("@/src/server/orgs", () => ({
	getDbOrgIdForClerkOrg: vi.fn().mockResolvedValue("00000000-0000-0000-0000-000000000001"),
}))

describe("POST /api/reports", () => {
	beforeAll(() => {
		process.env.APP_MASTER_KEY = Buffer.from(Array(32).fill(1)).toString("base64")
	})

	beforeAll(async () => {
		const orgId = "00000000-0000-0000-0000-000000000001"
		await db
			.insert(organizations)
			.values({ id: orgId, name: "Test Org", slug: "clerk-org-1", plan: "free", retentionDays: 365, locale: "pl-PL" })
			.onConflictDoNothing()
		const categoryId = "11111111-1111-1111-1111-111111111111"
		await db
			.insert(reportCategories)
			.values({ id: categoryId, orgId, name: "General", description: "" })
			.onConflictDoNothing()
	})

	it("creates a report and returns receipt + passphrase", async () => {
		const body = {
			categoryId: "11111111-1111-1111-1111-111111111111",
			body: "This is a valid report body with more than twenty characters.",
			anonymous: true,
			captchaToken: "ok",
		}

		const req = new NextRequest("http://localhost/api/reports", {
			method: "POST",
			body: JSON.stringify(body),
			headers: { "content-type": "application/json" },
		}) as any

		const res = await createReport(req)
		const json = await res.json()
		expect(res.status).toBe(200)
		expect(json.caseId || json.receiptCode).toBeTruthy()
		expect(json.caseKey || json.passphrase).toBeTruthy()
	})
})


