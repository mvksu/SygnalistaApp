"use client"

import { useEffect, useState } from "react"

export function SecurityTab() {
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/account/security", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        setMfaEnabled(!!data.mfaEnabled)
      } catch {}
    })()
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">Two-factor authentication</h3>
        <p className="text-sm text-muted-foreground">Enhance your account security with an extra verification step.</p>
        <div className="mt-3 rounded border p-3 text-sm">
          <div className="flex items-center justify-between">
            <span>Status</span>
            <span className="font-medium">{mfaEnabled === null ? "…" : mfaEnabled ? "Enabled" : "Disabled"}</span>
          </div>
        </div>
      </div>
    </div>
  )
}



