"use client"

import { useEffect } from "react"

type Provider = "turnstile" | "hcaptcha"

export type CaptchaProps = {
  provider?: Provider
  siteKey: string
  onVerify: (token: string) => void
  theme?: "light" | "dark"
  className?: string
}

declare global {
  interface Window {
    turnstile?: any
    hcaptcha?: any
  }
}

export function Captcha({ provider = "turnstile", siteKey, onVerify, theme = "light", className }: CaptchaProps) {
  useEffect(() => {
    if (provider === "turnstile") {
      const script = document.createElement("script")
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      script.async = true
      script.onload = () => {
        if (!window.turnstile) return
        window.turnstile.render("#captcha-container", {
          sitekey: siteKey,
          theme,
          callback: (token: string) => onVerify(token),
        })
      }
      document.body.appendChild(script)
      return () => {
        document.body.removeChild(script)
      }
    } else {
      const script = document.createElement("script")
      script.src = "https://js.hcaptcha.com/1/api.js?render=explicit"
      script.async = true
      script.onload = () => {
        if (!window.hcaptcha) return
        window.hcaptcha.render("#captcha-container", {
          sitekey: siteKey,
          theme,
          callback: (token: string) => onVerify(token),
        })
      }
      document.body.appendChild(script)
      return () => {
        document.body.removeChild(script)
      }
    }
  }, [provider, siteKey, onVerify, theme])

  return <div id="captcha-container" className={className} />
}


