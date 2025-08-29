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
  avatarUrl?: string
  attachments?: Array<{ id: string; filename: string; storageKey: string; size: number }>
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
      // Optimistically add the new message first so subsequent attachment updates can target it
      const createdAt = new Date().toISOString()
      setThread(prev => ([
        ...prev,
        {
          id: messageId,
          sender: "HANDLER",
          body: message.trim(),
          createdAt,
          attachments: []
        }
      ]))

      // Upload attachments if any, then attach to the created message
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
        const { uploadUrl, token, storageKey } = await presignRes.json()
        const formData = new FormData()
        formData.append("file", file)
        const uploadResp = await fetch(uploadUrl, { method: "POST", headers: token ? { authorization: `Bearer ${token}` } : undefined, body: formData })
        if (!uploadResp.ok) throw new Error("Upload failed")
        // Optimistically append attachment to the last message
        const isAudio = (file.type || "").startsWith("audio/") || /\.(webm|ogg|mp3|wav|m4a)$/i.test(file.name)
        setThread(prev => prev.map(msg => msg.id === messageId ? {
          ...msg,
          attachments: [...(msg.attachments || []), { id: crypto.randomUUID(), filename: file.name, storageKey, size: file.size }],
          ...(isAudio ? { /* set audioUrl so chat renders audio player */ audioUrl: `/api/files/download?key=${encodeURIComponent(storageKey)}` } : {})
        } : msg))
      }
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


