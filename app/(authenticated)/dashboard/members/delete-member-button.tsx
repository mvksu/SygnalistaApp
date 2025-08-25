"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function DeleteMemberButton({ email, canDelete }: { email: string; canDelete: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function onDelete() {
    if (!canDelete || !email) return
    if (!confirm(`Remove ${email} from the organization?`)) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/members/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || `${res.status} ${res.statusText}`)
      window.location.reload()
    } catch (e: any) {
      setError(e?.message || "Failed to remove member")
    } finally {
      setLoading(false)
    }
  }

  if (!canDelete) return null
  return (
    <div className="flex items-center gap-2">
      <Button variant="destructive" size="sm" onClick={onDelete} disabled={loading}>
        {loading ? "Removing..." : "Remove"}
      </Button>
      {error ? <span className="text-destructive text-xs">{error}</span> : null}
    </div>
  )
}



