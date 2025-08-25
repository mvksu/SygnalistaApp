import { describe, expect, it } from "vitest"
import { generateCaseId, generateCaseKey, hashCaseKey } from "./ids"

describe("ids", () => {
  it("generateCaseId returns 22-char groups pattern", () => {
    const id = generateCaseId()
    expect(id).toMatch(/^[-_A-Za-z0-9]{4}-[-_A-Za-z0-9]{4}-[-_A-Za-z0-9]{4}-[-_A-Za-z0-9]{4}-[-_A-Za-z0-9]{6}$/)
  })

  it("generateCaseKey returns base64url string without padding", () => {
    const key = generateCaseKey()
    expect(key).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(key.includes("=")).toBe(false)
  })

  it("hashCaseKey is deterministic and hex", () => {
    const a = hashCaseKey("secret")
    const b = hashCaseKey("secret")
    expect(a).toBe(b)
    expect(a).toMatch(/^[a-f0-9]{64}$/)
  })
})

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



