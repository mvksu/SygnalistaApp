import { z } from "zod"

const providerSchema = z.enum(["turnstile", "hcaptcha", "recaptcha"]).default("turnstile")

const envSchema = z.object({
  CAPTCHA_PROVIDER: providerSchema.optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  HCAPTCHA_SECRET_KEY: z.string().optional(),
  RECAPTCHA_SECRET_KEY: z.string().optional(),
  CAPTCHA_DISABLED: z.string().optional(),
})

function getEnv() {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) return {}
  return parsed.data
}

export type CaptchaVerifyResult = { success: true } | { success: false; error: string }

type VerifyOptions = {
  expectedAction?: string
  minScore?: number // for reCAPTCHA v3
}

export async function verifyCaptcha(token: string, remoteip?: string, options?: VerifyOptions): Promise<CaptchaVerifyResult> {
  const { CAPTCHA_PROVIDER, TURNSTILE_SECRET_KEY, HCAPTCHA_SECRET_KEY, RECAPTCHA_SECRET_KEY, CAPTCHA_DISABLED } = getEnv() as any
  // Global bypass toggle
  if (CAPTCHA_DISABLED === "true" || CAPTCHA_DISABLED === "1") {
    return { success: true }
  }
  const provider: "turnstile" | "hcaptcha" | "recaptcha" = (CAPTCHA_PROVIDER as any) || "turnstile"

  try {
    if (provider === "turnstile") {
      if (!TURNSTILE_SECRET_KEY) {
        // Allow local dev bypass when no secret is configured and the client returned the dev token
        if (process.env.NODE_ENV !== "production" && token === "dev-token") {
          return { success: true }
        }
        return { success: false, error: "TURNSTILE_SECRET_KEY not set" }
      }
      const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret: TURNSTILE_SECRET_KEY, response: token, remoteip: remoteip || "" }),
      })
      const data = (await resp.json()) as { success: boolean; "error-codes"?: string[] }
      if (data.success) return { success: true }
      return { success: false, error: (data["error-codes"] || []).join(",") || "turnstile failed" }
    }

    if (provider === "hcaptcha") {
      if (!HCAPTCHA_SECRET_KEY) {
        if (process.env.NODE_ENV !== "production" && token === "dev-token") {
          return { success: true }
        }
        return { success: false, error: "HCAPTCHA_SECRET_KEY not set" }
      }
      const resp = await fetch("https://hcaptcha.com/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret: HCAPTCHA_SECRET_KEY, response: token, remoteip: remoteip || "" }),
      })
      const data = (await resp.json()) as { success: boolean; "error-codes"?: string[] }
      if (data.success) return { success: true }
      return { success: false, error: (data["error-codes"] || []).join(",") || "hcaptcha failed" }
    }

    // Google reCAPTCHA v2/v3 verification
    if (!RECAPTCHA_SECRET_KEY) {
      if (process.env.NODE_ENV !== "production" && token === "dev-token") {
        return { success: true }
      }
      return { success: false, error: "RECAPTCHA_SECRET_KEY not set" }
    }
    const resp = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: RECAPTCHA_SECRET_KEY, response: token, remoteip: remoteip || "" }),
    })
    const data = (await resp.json()) as { success: boolean; action?: string; score?: number; [k: string]: unknown }
    if (!data.success) return { success: false, error: "recaptcha failed" }
    if (typeof options?.expectedAction === "string" && data.action && data.action !== options.expectedAction) {
      return { success: false, error: `recaptcha action mismatch: expected ${options.expectedAction}, got ${data.action}` }
    }
    if (typeof options?.minScore === "number" && typeof data.score === "number" && data.score < options.minScore) {
      return { success: false, error: `recaptcha score too low: ${data.score}` }
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || "captcha verify error" }
  }
}

export async function verifyRecaptchaV3(token: string, remoteip?: string, options?: VerifyOptions): Promise<CaptchaVerifyResult> {
  const { RECAPTCHA_SECRET_KEY, CAPTCHA_DISABLED } = getEnv() as any
  if (CAPTCHA_DISABLED === "true" || CAPTCHA_DISABLED === "1") {
    return { success: true }
  }
  try {
    if (!RECAPTCHA_SECRET_KEY) {
      if (process.env.NODE_ENV !== "production" && token === "dev-token") {
        return { success: true }
      }
      return { success: false, error: "RECAPTCHA_SECRET_KEY not set" }
    }
    const resp = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: RECAPTCHA_SECRET_KEY, response: token, remoteip: remoteip || "" }),
    })
    const data = (await resp.json()) as { success: boolean; action?: string; score?: number; [k: string]: unknown }
    if (!data.success) return { success: false, error: "recaptcha failed" }
    if (typeof options?.expectedAction === "string" && data.action && data.action !== options.expectedAction) {
      return { success: false, error: `recaptcha action mismatch: expected ${options.expectedAction}, got ${data.action}` }
    }
    if (typeof options?.minScore === "number" && typeof data.score === "number" && data.score < options.minScore) {
      return { success: false, error: `recaptcha score too low: ${data.score}` }
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || "captcha verify error" }
  }
}


