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
  audioUrl?: string
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


  async function sendMessage(messageText?: string) {
    const textToSend = messageText || message.trim()
    // Allow sending if there's text OR files (files can be sent without text)
    if (!textToSend && files.length === 0) return
    setSubmitting(true)
    try {
      const res = await postJson(`/api/reports/${reportId}/messages`, { body: textToSend })
      const { messageId } = await res.json()
      // Optimistically add the new message first so subsequent attachment updates can target it
      const createdAt = new Date().toISOString()
      setThread(prev => ([
        ...prev,
        {
          id: messageId,
          sender: "HANDLER",
          body: textToSend || "", // Ensure empty string if no text
          createdAt,
          attachments: []
        }
      ]))

      // Upload attachments if any, then attach to the created message
      for (const file of files) {
        const presignRes = await fetch(`/api/files/presign`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type || "application/octet-stream",
            size: file.size,
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
        console.log("Uploading file:", file.name, "isAudio:", isAudio, "storageKey:", storageKey)
        setThread(prev => {
          const updated = prev.map(msg => msg.id === messageId ? {
            ...msg,
            attachments: [...(msg.attachments || []), { id: crypto.randomUUID(), filename: file.name, storageKey, size: file.size }],
            ...(isAudio ? { audioUrl: `/api/files/download?key=${encodeURIComponent(storageKey)}` } : {})
          } : msg)
          console.log("Updated thread:", updated)
          return updated
        })
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
      onSend={async ({ text, files: newFiles }) => {
        setFiles(newFiles)
        await sendMessage(text)
      }}
    />
  )
}


