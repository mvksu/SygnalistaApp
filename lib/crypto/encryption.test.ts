import { describe, expect, it, beforeAll } from "vitest"
import { encryptField, decryptField } from "./encryption"

describe("encryption", () => {
  beforeAll(() => {
    process.env.APP_MASTER_KEY = Buffer.from(Array(32).fill(7)).toString("base64")
  })
  it("encrypts and decrypts roundtrip with same org and version", () => {
    const orgId = "org_test"
    const plaintext = "hello world"
    const enc = encryptField(orgId, plaintext)
    const dec = decryptField(orgId, enc)
    expect(dec.toString("utf8")).toBe(plaintext)
  })

  it("supports AAD option", () => {
    const orgId = "org_test"
    const aad = Buffer.from("context")
    const enc = encryptField(orgId, "msg", { aad })
    const dec = decryptField(orgId, enc)
    expect(dec.toString("utf8")).toBe("msg")
  })
})

import { describe, it, expect } from "vitest"
import { encryptField, decryptField } from "./encryption"
import { generateMasterKeyB64 } from "./keys"

describe("encryptField/decryptField", () => {
	it("round-trips plaintext with AAD", () => {
		process.env.APP_MASTER_KEY = generateMasterKeyB64()
		const orgId = "org_123"
		const aad = "meta:contact"
		const plaintext = "Sensitive text äöü😊"
		const enc = encryptField(orgId, plaintext, { aad })
		const dec = decryptField(orgId, enc).toString("utf8")
		expect(dec).toBe(plaintext)
		// Ensure base64 fields look sane
		expect(typeof enc.iv).toBe("string")
		expect(typeof enc.tag).toBe("string")
		expect(typeof enc.ct).toBe("string")
		expect(enc.v).toBe(1)
	})

	it("fails to decrypt when AAD is wrong", () => {
		process.env.APP_MASTER_KEY = generateMasterKeyB64()
		const orgId = "org_abc"
		const enc = encryptField(orgId, "hello", { aad: "A" })
		// tamper AAD
		enc.aad = Buffer.from("B").toString("base64")
		expect(() => decryptField(orgId, enc)).toThrow()
	})

	it("fails to decrypt with different org key", () => {
		process.env.APP_MASTER_KEY = generateMasterKeyB64()
		const org1 = "org1"
		const org2 = "org2"
		const enc = encryptField(org1, "secret")
		expect(() => decryptField(org2, enc)).toThrow()
	})
})



