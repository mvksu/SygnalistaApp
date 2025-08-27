"use client"

import { useEffect, useState } from "react"
import { Button } from "tweakcn/ui/button"

type Prefs = {
  emailCaseUpdates: boolean
  emailAnnouncements: boolean
}

export function NotificationsTab() {
  const [prefs, setPrefs] = useState<Prefs>({ emailCaseUpdates: true, emailAnnouncements: false })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let aborted = false
    ;(async () => {
      try {
        const res = await fetch("/api/account/notifications", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (!aborted) setPrefs({
          emailCaseUpdates: !!data.emailCaseUpdates,
          emailAnnouncements: !!data.emailAnnouncements
        })
      } catch {}
    })()
    return () => { aborted = true }
  }, [])

  async function onSave() {
    setSaving(true)
    try {
      await fetch("/api/account/notifications", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(prefs)
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded border p-4">
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={prefs.emailCaseUpdates} onChange={e => setPrefs(p => ({ ...p, emailCaseUpdates: e.target.checked }))} />
          Email me about case updates
        </label>
      </div>
      <div className="rounded border p-4">
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={prefs.emailAnnouncements} onChange={e => setPrefs(p => ({ ...p, emailAnnouncements: e.target.checked }))} />
          Email me about announcements
        </label>
      </div>
      <div>
        <Button className="px-3 py-2 text-sm" onClick={onSave} disabled={saving} variant="primary" size="sm">
          Save preferences
        </Button>
      </div>
    </div>
  )
}



