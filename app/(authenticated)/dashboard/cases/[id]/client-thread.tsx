"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Card } from "tweakcn/ui/card"
import { Checkbox } from "tweakcn/ui/checkbox"

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
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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
      const res = await postJson(`/api/reports/${reportId}/messages`, { body: message.trim() })
      const { messageId } = await res.json()
      // Upload attachments if any
      for (const file of files) {
        const checksum = "" // optional: compute client-side if desired
        const presignRes = await fetch(`/api/files/presign`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type || "application/octet-stream",
            size: file.size,
            checksum,
            reportId,
            messageId,
          })
        })
        if (!presignRes.ok) throw new Error("Failed to presign upload")
        const { uploadUrl, token } = await presignRes.json()
        const formData = new FormData()
        formData.append("file", file)
        const uploadResp = await fetch(uploadUrl, { method: "POST", headers: token ? { authorization: `Bearer ${token}` } : undefined, body: formData })
        if (!uploadResp.ok) throw new Error("Upload failed")
      }
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
      setFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ""
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={acknowledge} disabled={actionLoading !== null}>
                  {actionLoading === "ack" ? "Acknowledging..." : "Acknowledge"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mark case as acknowledged</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={giveFeedback} disabled={actionLoading !== null}>
                  {actionLoading === "feedback" ? "Saving..." : "Feedback given"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mark follow-up communication as sent</TooltipContent>
            </Tooltip>
      </div>

      <div className="space-y-3">
        {thread.map((m) => (
          <Card key={m.id} className="p-3">
            <div className="mb-1 text-xs text-muted-foreground">
              {m.sender} • {new Date(m.createdAt).toLocaleString()}
            </div>
            <div className="whitespace-pre-wrap flex items-start gap-2">
              <span className="mt-1 inline-block" aria-hidden>💬</span>
              <span>{m.body}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a message to the sender"
          rows={3}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="block text-sm"
              onChange={e => setFiles(Array.from(e.target.files || []))}
            />
          </TooltipTrigger>
          <TooltipContent>Attach files (PDF, images, docs)</TooltipContent>
        </Tooltip>
        <div className="flex gap-2">
          <Button size="sm" onClick={sendMessage} disabled={submitting}>
            {submitting ? "Sending..." : "Send"}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="anonymousSend"
            checked={anonymousSend}
            onCheckedChange={(checked) => setAnonymousSend(!!checked)}
          />
          <label htmlFor="anonymousSend" className="text-sm text-muted-foreground">
            Do not display my name to the sender
          </label>
        </div>
      </div>
    </div>
  )
}


