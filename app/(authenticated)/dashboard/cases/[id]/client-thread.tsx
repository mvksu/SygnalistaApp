"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type ThreadItem = {
  id: string
  sender: "REPORTER" | "HANDLER"
  body: string
  createdAt: string
}

type Props = {
  reportId: string
  initialThread: ThreadItem[]
}

export default function CaseThreadClient({ reportId, initialThread }: Props) {
  const [thread, setThread] = useState<ThreadItem[]>(initialThread)
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState<"ack" | "feedback" | null>(null)
  const [anonymousSend, setAnonymousSend] = useState(false)

  async function postJson(url: string, body?: unknown) {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!resp.ok) throw new Error(await resp.text())
    return resp
  }

  async function acknowledge() {
    try {
      setActionLoading("ack")
      await postJson(`/api/reports/${reportId}/acknowledge`)
    } finally {
      setActionLoading(null)
    }
  }

  async function giveFeedback() {
    try {
      setActionLoading("feedback")
      await postJson(`/api/reports/${reportId}/feedback`)
    } finally {
      setActionLoading(null)
    }
  }

  async function sendMessage() {
    if (!message.trim()) return
    setSubmitting(true)
    try {
      await postJson(`/api/reports/${reportId}/messages`, { body: message.trim() })
      setThread((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: "HANDLER",
          body: message.trim(),
          createdAt: new Date().toISOString(),
        },
      ])
      setMessage("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={acknowledge} disabled={actionLoading !== null}>
          {actionLoading === "ack" ? "Acknowledging..." : "Acknowledge"}
        </Button>
        <Button variant="outline" size="sm" onClick={giveFeedback} disabled={actionLoading !== null}>
          {actionLoading === "feedback" ? "Saving..." : "Feedback given"}
        </Button>
      </div>

      <div className="space-y-3">
        {thread.map((m) => (
          <div key={m.id} className="rounded border p-3">
            <div className="mb-1 text-xs text-muted-foreground">
              {m.sender} • {new Date(m.createdAt).toLocaleString()}
            </div>
            <div className="whitespace-pre-wrap">{m.body}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a message..."
          rows={3}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={sendMessage} disabled={submitting}>
            {submitting ? "Sending..." : "Send"}
          </Button>
        </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymousSend"
              className="h-4 w-4"
              checked={anonymousSend}
              onChange={(e) => setAnonymousSend(e.target.checked)}
            />
            <label htmlFor="anonymousSend" className="text-sm text-muted-foreground">
              Do not display my name to the sender
            </label>
          </div>
      </div>
    </div>
  )
}


