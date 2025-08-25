"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { X } from "lucide-react"

export function OnboardingActions({
  title,
  description,
  href,
  keyName,
  action
}: {
  title: string
  description?: string
  href?: string
  keyName: string
  action?: () => Promise<void>
}) {
  const [completed, setCompleted] = useState(false)
  const [showIntro, setShowIntro] = useState(false)

  useEffect(() => {
    ;(async () => {
      const res = await fetch("/api/onboarding", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        if (keyName && data?.[keyName]) setCompleted(true)
      }
    })()
  }, [keyName])

  async function markCompleted() {
    console.log("onboarding:updated2")
    if (action) await action()
    if (keyName) {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: keyName })
      })
      console.log("onboarding:updated")
    }
    setCompleted(true)
    window.dispatchEvent(new CustomEvent("onboarding:updated"))
  }

  return (
    <div className="mt-8 flex flex-col items-center justify-center gap-2">
      {href ? (
        <Button disabled={completed}>
          <Link href={href} onClick={() => markCompleted()}>{completed ? "Completed" : `Go to ${title.toLowerCase()}`}</Link>
        </Button>
      ) : (
        <>
          <Button
            onClick={() => {
              if (keyName === "watch_intro") setShowIntro(true)
              else void markCompleted()
            }}
            disabled={completed}
          >
            {completed ? "Completed" : `Go to ${title.toLowerCase()}`}
          </Button>
          {showIntro && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60" onClick={() => setShowIntro(false)} />
              <div className="relative z-10 w-[90vw] max-w-3xl rounded-md bg-card p-4 shadow-xl">
                <button
                  type="button"
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                  onClick={() => setShowIntro(false)}
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="space-y-3">
                  <div className="text-lg font-semibold">Welcome tour</div>
                  <div className="aspect-video w-full overflow-hidden rounded">
                    <iframe
                      className="h-full w-full"
                      src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                      title="Intro"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setShowIntro(false)}>
                      Back
                    </Button>
                    <Button
                      onClick={async () => {
                        await markCompleted()
                        setShowIntro(false)
                      }}
                    >
                      Complete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {description && (
        <Button variant="outline" onClick={markCompleted} disabled={completed}>
          {completed ? "Done" : "skip"}
        </Button>
      )}
    </div>
  )
}


