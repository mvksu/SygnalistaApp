"use client"

import { useEffect, useMemo, useState } from "react"

const TOTAL_STEPS = 5

export function OnboardingProgress() {
  const [completed, setCompleted] = useState<number>(0)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/onboarding", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as Record<string, boolean>
        const count = Object.values(data).filter(Boolean).length
        setCompleted(count)
      } catch {
        // noop
      }
    }
    load()
    const handler = () => load()
    window.addEventListener("onboarding:updated", handler)
    return () => window.removeEventListener("onboarding:updated", handler)
  }, [])

  const percent = useMemo(() => {
    const p = Math.round((completed / TOTAL_STEPS) * 100)
    return Number.isFinite(p) ? p : 0
  }, [completed])

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-48 rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-green-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-muted-foreground text-sm">{percent}% Complete</span>
    </div>
  )
}


