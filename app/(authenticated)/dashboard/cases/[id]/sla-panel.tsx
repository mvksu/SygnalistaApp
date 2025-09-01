"use client"

import { useEffect, useMemo, useState } from "react"

type SlaEvent = {
  id: string
  type: "ACK_DUE" | "FEEDBACK_DUE"
  status: "PENDING" | "SENT" | "SKIPPED"
  dueAt: string
  createdAt: string
  sentAt?: string | null
}

export default function SlaPanel({ reportId }: { reportId: string }) {
  const [data, setData] = useState<{
    ackDueAt: string
    ackStatus: "due" | "overdue" | "done"
    feedbackDueAt: string | null
    feedbackStatus: "due" | "overdue" | "done"
    events: SlaEvent[]
    slaDisabled?: boolean
    message?: string
  } | null>(null)

  useEffect(() => {
    let aborted = false
    ;(async () => {
      try {
        const res = await fetch(`/api/reports/${reportId}/sla`, { cache: "no-store" })
        if (!res.ok) return
        const j = await res.json()
        if (!aborted) setData(j)
      } catch {}
    })()
    return () => { aborted = true }
  }, [reportId])

  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString() : "—")
  const chip = (state: "due" | "overdue" | "done", dueAt?: string | null) => {
    const cls = state === "done" ? "bg-emerald-100 text-emerald-900" : state === "overdue" ? "bg-red-100 text-red-900" : "bg-amber-100 text-amber-900"
    let remain = ""
    if (dueAt && state !== "done") {
      const days = Math.ceil((new Date(dueAt).getTime() - Date.now()) / (1000*60*60*24))
      remain = days >= 0 ? `${days}d` : `${Math.abs(days)}d late`
    }
    return <span className={`px-2 py-1 rounded text-xs ${cls}`}>{state}{remain ? ` • ${remain}` : ""}</span>
  }

  if (!data) return null

  if (data.slaDisabled) {
    return (
      <div className="text-sm text-muted-foreground">
        <div className="flex items-center gap-2 mb-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="font-medium">SLA Disabled</span>
        </div>
        <p className="text-xs">{data.message || "SLA tracking is disabled for this organization"}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid gap-3 text-sm">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground">Acknowledgement due</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{fmt(data.ackDueAt)}</span>
            {chip(data.ackStatus, data.ackDueAt)}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground">Feedback due</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{fmt(data.feedbackDueAt)}</span>
            {chip(data.feedbackStatus, data.feedbackDueAt)}
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-2 text-sm font-medium">Recent SLA events</div>
        <div className="rounded border">
          {data.events.length === 0 ? (
            <div className="p-3 text-xs text-muted-foreground">No events</div>
          ) : (
            <ul className="divide-y">
              {data.events.map(e => (
                <li key={e.id} className="flex items-center justify-between p-2 text-xs">
                  <span>{e.type} • {e.status}</span>
                  <span className="text-muted-foreground">{fmt(e.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}


