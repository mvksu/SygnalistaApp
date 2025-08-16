import { describe, it, expect } from "vitest"
import { generateCaseId as generateReceiptCode, generateCaseKey as generatePassphrase, hashCaseKey as hashPassphrase } from "./ids"

describe("ids", () => {
	it("generateReceiptCode returns readable 4-4-4-4-6 format", () => {
		const r = generateReceiptCode()
		expect(r).toMatch(/^[-A-Za-z0-9_]{4}-[-A-Za-z0-9_]{4}-[-A-Za-z0-9_]{4}-[-A-Za-z0-9_]{4}-[-A-Za-z0-9_]{6}$/)
	})

	it("generatePassphrase returns base64url-like without padding", () => {
		const p = generatePassphrase()
		expect(p).not.toMatch(/[=]/)
		expect(p.length).toBeGreaterThanOrEqual(30)
	})

	it("hashPassphrase is deterministic and SHA-256 length", () => {
		const h1 = hashPassphrase("abc")
		const h2 = hashPassphrase("abc")
		expect(h1).toBe(h2)
		expect(h1).toMatch(/^[a-f0-9]{64}$/)
	})
})



