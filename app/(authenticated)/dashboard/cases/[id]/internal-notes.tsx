"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

type InternalNote = {
  id: string
  message: string
  createdAt: string | Date
  userName?: string | null
}

export default function InternalNotes({
  reportId,
  initialNotes
}: {
  reportId: string
  initialNotes: InternalNote[]
}) {
  const [notes, setNotes] = useState<InternalNote[]>(initialNotes || [])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)

  async function submit() {
    const body = text.trim()
    if (!body) return
    setSending(true)
    try {
      const res = await fetch(`/api/reports/${reportId}/internal-comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body })
      })
      if (!res.ok) throw new Error("Failed to add comment")
      const created = (await res.json()) as InternalNote
      setNotes(prev => [...prev, created])
      setText("")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {notes.length === 0 ? (
        <div className="text-muted-foreground mx-auto my-8 text-sm">
          You don't have any internal comments yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(n => (
            <div key={n.id} className="rounded border p-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="font-medium">{n.userName || "Internal"}</div>
                <div className="text-muted-foreground text-xs">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="mt-1 whitespace-pre-wrap">{n.message}</div>
            </div>
          ))}
        </div>
      )}
      <div className="sticky bottom-0 mt-2 flex items-start gap-2 border-t pt-3">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write a comment..."
          className="min-h-[60px] flex-1 resize-y rounded-md border px-3 py-2 text-sm focus:outline-none"
        />
        <Button disabled={sending || !text.trim()} onClick={submit}>
          Add a comment
        </Button>
      </div>
    </div>
  )
}



