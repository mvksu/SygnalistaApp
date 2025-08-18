"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type Provider = "turnstile" | "hcaptcha" | "recaptcha"

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
    grecaptcha?: any
  }
}

export function Captcha({ provider = "hcaptcha", siteKey, onVerify, theme = "light", className }: CaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  const clearAndRender = useCallback(() => {
    setError(null)
    if (!siteKey) return
    if (provider === "turnstile") {
      if (!window.turnstile || !containerRef.current) return
      containerRef.current.innerHTML = ""
      window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        callback: (token: string) => onVerify(token),
        "expired-callback": () => onVerify(""),
        "error-callback": () => setError("Captcha error. Please reload and try again."),
      })
      return
    }
    if (provider === "hcaptcha") {
      if (!window.hcaptcha || !containerRef.current) return
      containerRef.current.innerHTML = ""
      window.hcaptcha.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        callback: (token: string) => onVerify(token),
        "expired-callback": () => onVerify(""),
        "error-callback": () => setError("Captcha error. Please reload and try again."),
      })
      return
    }
    if (!window.grecaptcha || !containerRef.current) return
    containerRef.current.innerHTML = ""
    window.grecaptcha.render(containerRef.current, {
      sitekey: siteKey,
      theme,
      callback: (token: string) => onVerify(token),
      "expired-callback": () => onVerify(""),
      "error-callback": () => setError("Captcha error. Please reload and try again."),
    })
  }, [provider, siteKey, theme, onVerify])

  useEffect(() => {
    // Dev fallback if no site key: bypass with dummy token
    if (!siteKey) {
      onVerify("dev-token")
      return
    }

    const renderTurnstile = () => clearAndRender()
    const renderHcaptcha = () => clearAndRender()
    const renderRecaptcha = () => clearAndRender()

    if (provider === "turnstile") {
      const id = "turnstile-script"
      if (!document.getElementById(id)) {
        const script = document.createElement("script")
        script.id = id
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        script.async = true
        script.onload = renderTurnstile
        document.body.appendChild(script)
      } else {
        renderTurnstile()
      }
      return
    }
    if (provider === "hcaptcha") {
      const id = "hcaptcha-script"
      if (!document.getElementById(id)) {
        const script = document.createElement("script")
        script.id = id
        script.src = "https://js.hcaptcha.com/1/api.js?render=explicit"
        script.async = true
        script.onload = renderHcaptcha
        document.body.appendChild(script)
      } else {
        renderHcaptcha()
      }
      return
    }
    const id = "recaptcha-script"
    if (!document.getElementById(id)) {
      const script = document.createElement("script")
      script.id = id
      script.src = "https://www.google.com/recaptcha/api.js?render=explicit"
      script.async = true
      script.onload = renderRecaptcha
      document.body.appendChild(script)
    } else {
      renderRecaptcha()
    }
  }, [provider, siteKey, onVerify, theme, clearAndRender])

  return (
    <div className={className}>
      <div ref={containerRef} />
      {error && (
        <div className="mt-2 text-sm text-red-600">{error}</div>
      )}
      <button
        type="button"
        className="mt-2 text-xs text-muted-foreground underline"
        onClick={clearAndRender}
        aria-label="Reload captcha"
      >
        Reload captcha
      </button>
    </div>
  )
}


