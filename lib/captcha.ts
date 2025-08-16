import { z } from "zod"

const providerSchema = z.enum(["turnstile", "hcaptcha"]).default("turnstile")

const envSchema = z.object({
  CAPTCHA_PROVIDER: providerSchema.optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  HCAPTCHA_SECRET_KEY: z.string().optional(),
  CAPTCHA_DISABLED: z.string().optional(),
})

function getEnv() {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) return {}
  return parsed.data
}

export type CaptchaVerifyResult = { success: true } | { success: false; error: string }

export async function verifyCaptcha(token: string, remoteip?: string): Promise<CaptchaVerifyResult> {
  const { CAPTCHA_PROVIDER, TURNSTILE_SECRET_KEY, HCAPTCHA_SECRET_KEY, CAPTCHA_DISABLED } = getEnv() as any
  // Global bypass toggle
  if (CAPTCHA_DISABLED === "true" || CAPTCHA_DISABLED === "1") {
    return { success: true }
  }
  const provider: "turnstile" | "hcaptcha" = (CAPTCHA_PROVIDER as any) || "turnstile"

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
  } catch (err: any) {
    return { success: false, error: err?.message || "captcha verify error" }
  }
}


