import { createCipheriv, createDecipheriv, randomBytes } from "crypto"
import type { EncryptionOptions, EncryptedPayload } from "./types"
import { deriveOrgKey } from "./keys"

const ALGO = "aes-256-gcm"
const IV_LENGTH = 12
const TAG_LENGTH = 16

function toB64(buf: Buffer): string {
  return buf.toString("base64")
}

function fromB64(b64: string): Buffer {
  return Buffer.from(b64, "base64")
}

export function encryptField(
  orgId: string,
  plaintext: string | Buffer,
  options: EncryptionOptions = {}
): EncryptedPayload {
  const { aad, keyVersion = 1 } = options
  const { keyBytes, version } = deriveOrgKey(orgId, keyVersion)

  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGO, keyBytes, iv, { authTagLength: TAG_LENGTH })
  if (aad) cipher.setAAD(Buffer.isBuffer(aad) ? aad : Buffer.from(aad))

  const ct = Buffer.concat([
    cipher.update(Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext)),
    cipher.final()
  ])
  const tag = cipher.getAuthTag()

  return {
    v: version,
    iv: toB64(iv),
    tag: toB64(tag),
    ct: toB64(ct),
    aad: aad ? toB64(Buffer.isBuffer(aad) ? aad : Buffer.from(aad)) : undefined
  }
}

export function decryptField(
  orgId: string,
  payload: EncryptedPayload
): Buffer {
  const { v, iv, tag, ct, aad } = payload
  const { keyBytes } = deriveOrgKey(orgId, v)

  const decipher = createDecipheriv(ALGO, keyBytes, fromB64(iv), {
    authTagLength: TAG_LENGTH
  })
  decipher.setAuthTag(fromB64(tag))
  if (aad) decipher.setAAD(fromB64(aad))

  const pt = Buffer.concat([decipher.update(fromB64(ct)), decipher.final()])
  return pt
}


