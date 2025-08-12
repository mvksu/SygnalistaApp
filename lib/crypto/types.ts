export type Base64String = string

export type KeyVersion = number

export interface KeyInfo {
  version: KeyVersion
  keyBytes: Buffer
}

export interface EncryptionOptions {
  aad?: string | Buffer
  keyVersion?: KeyVersion
}

export interface EncryptedPayload {
  /** AES-GCM versioned envelope key identifier */
  v: KeyVersion
  /** Base64-encoded IV (12 bytes recommended for GCM) */
  iv: Base64String
  /** Base64-encoded authentication tag */
  tag: Base64String
  /** Base64-encoded ciphertext */
  ct: Base64String
  /** Optional Base64-encoded AAD that was authenticated */
  aad?: Base64String
}


