import { randomBytes, createHash } from "crypto"

export function generateCaseId(): string {
  // 16 bytes -> 22 char base64url (remove padding) then add dashes for readability
  const raw = randomBytes(16).toString("base64").replace(/[+/=]/g, (m) => ({ "+": "-", "/": "_", "=": "" }[m] as string))
  // group into 4-4-4-4-6 style (total 22) -> 4-4-4-4-6 with last group 6
  return `${raw.slice(0,4)}-${raw.slice(4,8)}-${raw.slice(8,12)}-${raw.slice(12,16)}-${raw.slice(16,22)}`
}

export function generateCaseKey(): string {
  // 24 bytes random, base64url -> 32- char
  return randomBytes(24)
    .toString("base64")
    .replace(/[+/=]/g, (m) => ({ "+": "-", "/": "_", "=": "" }[m] as string))
}

export function hashCaseKey(passphrase: string): string {
  // Use SHA-256; can be swapped to argon2/scrypt later if needed
  return createHash("sha256").update(passphrase).digest("hex")
}


