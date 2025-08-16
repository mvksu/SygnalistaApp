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



