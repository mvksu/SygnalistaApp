"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Card } from "tweakcn/ui/card"
import { Checkbox } from "tweakcn/ui/checkbox"
import Chat from "./chat"

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
    <Chat
      messages={thread}
      submitting={submitting}
      onSend={async ({ text }) => {
        setMessage(text)
        await sendMessage()
      }}
    />
  )
}


