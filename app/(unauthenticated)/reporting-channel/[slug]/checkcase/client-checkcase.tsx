"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function CheckCaseClient({ slug }: { slug: string }) {
  const [caseID, setCaseID] = useState("")
  const [caseKey, setCaseKey] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  return (
    <Card className="mx-auto my-auto max-w-md space-y-4 py-10">
      <CardHeader>
        <h1 className="text-2xl font-semibold">Check Case</h1>
        <p className="text-muted-foreground text-sm">
          Enter your case ID and case key to open your secure inbox.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <label className="text-sm font-medium">Case ID</label>
          <input
            value={caseID}
            onChange={e => setCaseID(e.target.value)}
            className="w-full rounded border px-2 py-2"
            placeholder="e.g. ABCD-EFGH-..."
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Case key</label>
          <input
            value={caseKey}
            onChange={e => setCaseKey(e.target.value)}
            className="w-full rounded border px-2 py-2"
            placeholder="Your passphrase"
          />
        </div>
        <div className="flex items-center gap-2 my-4">
          <Button
            disabled={submitting}
            onClick={async () => {
              setError(null)
              if (!caseID || !caseKey) {
                setError("Please enter both Case ID and Case key.")
                return
              }
              try {
                setSubmitting(true)
                // Probe auth to validate before navigation for better UX
                const probe = await fetch(
                  `/api/inbox/${encodeURIComponent(caseID)}/auth`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ caseKey, captchaToken: "dev-token" })
                  }
                )
                if (!probe.ok) {
                  setError("Invalid Case ID or Case key. Please try again.")
                  return
                }
                router.push(
                  `/reporting-channel/${encodeURIComponent(slug)}/checkcase/${encodeURIComponent(caseID)}?caseKey=${encodeURIComponent(caseKey)}`
                )
              } catch {
                setError("Something went wrong. Please try again.")
              } finally {
                setSubmitting(false)
              }
            }}
          >
            {submitting ? "Checking..." : "Open"}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
