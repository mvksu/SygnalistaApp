import { randomBytes } from "crypto"
import type { KeyInfo, KeyVersion } from "./types"

const MASTER_KEY_ENV = "APP_MASTER_KEY" // base64 (32 bytes)

function getMasterKey(): Buffer {
  const b64 = process.env[MASTER_KEY_ENV]
  if (!b64) {
    throw new Error(
      `${MASTER_KEY_ENV} is not set. Provide a base64-encoded 32-byte key.`
    )
  }
  const buf = Buffer.from(b64, "base64")
  if (buf.length !== 32) {
    throw new Error(
      `${MASTER_KEY_ENV} must decode to 32 bytes (got ${buf.length}).`
    )
  }
  return buf
}

// In production, store per-org envelope keys in DB sealed with KMS.
// For MVP, derive a deterministic per-org key from master + orgId using HKDF-like approach.
export function deriveOrgKey(orgId: string, version: KeyVersion = 1): KeyInfo {
  const master = getMasterKey()
  // Simple derivation: HMAC-like mixing using random salt based on version.
  // For MVP, we simulate by XOR'ing bytes with a tiny PRF; replace with HKDF in prod.
  const salt = Buffer.alloc(32, version)
  const keyBytes = Buffer.alloc(32)
  for (let i = 0; i < 32; i++) {
    const m = master[i]
    const s = salt[i]
    const o = orgId.charCodeAt(i % orgId.length) & 0xff
    keyBytes[i] = m ^ s ^ o
  }
  return { version, keyBytes }
}

export function generateMasterKeyB64(): string {
  return randomBytes(32).toString("base64")
}


