"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useParams, useSearchParams } from "next/navigation"

type ThreadMessage = {
  id: string
  sender: "REPORTER" | "HANDLER"
  body: string
  createdAt: string
}

type AttachmentItem = {
  id: string
  filename: string
  size: number
  storageKey: string
  downloadUrl: string
  messageId: string | null
}

type ThreadData = {
  report: {
    id: string
    caseId: string
    reporterMode: "ANON" | "IDENTIFIED"
    categoryId: string
    categoryName: string
    createdAt: string
    lastUpdated: string
  }
  messages: ThreadMessage[]
  attachments: AttachmentItem[]
}

export default function ReporterInboxPage() {
  const params = useParams<{ case: string; slug: string }>()
  const searchParams = useSearchParams()
  const caseID = params.case
  const [caseKey, setCaseKey] = useState(searchParams?.get("caseKey") || "")
  const [unlocked, setUnlocked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [body, setBody] = useState("")
  const [captchaToken] = useState("dev-token")
  const [reportMeta, setReportMeta] = useState<ThreadData["report"] | null>(null)
  const [attachments, setAttachments] = useState<AttachmentItem[]>([])

  useEffect(() => {
    if (caseKey) {
      unlock().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function unlock() {
    setError(null)
    setLoading(true)
    const resp = await fetch(`/api/inbox/${encodeURIComponent(caseID)}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseKey: caseKey, captchaToken })
    })
    if (!resp.ok) {
      setLoading(false)
      setError("Invalid Case ID or Case key. Please try again.")
      return
    }
    setUnlocked(true)
    await loadThread()
    setLoading(false)
  }

  async function loadThread() {
    const resp = await fetch(
      `/api/inbox/${encodeURIComponent(caseID)}/messages`,
      {
        headers: { "x-passphrase": caseKey }
      }
    )
    if (!resp.ok) throw new Error("Failed to load thread")
    const data: ThreadData = await resp.json()
    setReportMeta(data.report)
    setAttachments(data.attachments || [])
    setMessages(data.messages || [])
    try {
      await fetch(`/api/reports/${data.report.id}/viewed`, { method: "POST" })
    } catch {}
  }

  async function sendMessage() {
    const resp = await fetch(
      `/api/inbox/${encodeURIComponent(caseID)}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase: caseKey, body, captchaToken })
      }
    )
    if (!resp.ok) throw new Error("Failed to send")
    setBody("")
    await loadThread()
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-4 py-10">
      <h1 className="text-2xl font-semibold">My case</h1>
      {!unlocked ? (
        <div className="space-y-4">
          <div>
            <div className="mb-1 text-sm">Case ID</div>
            <Input value={caseID} disabled />
          </div>
          <div>
            <div className="mb-1 text-sm">Case key</div>
            <Input
              value={caseKey}
              onChange={e => setCaseKey(e.target.value)}
              type="password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={unlock} disabled={loading}>
            {loading ? "Unlocking..." : "Unlock"}
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <aside className="space-y-4 md:col-span-1">
            <div className="rounded border p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Case #{reportMeta?.caseId?.slice(0,6) || ""}</div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground">Submitted</div>
                  <div>{reportMeta ? new Date(reportMeta.createdAt).toLocaleString() : ""}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Last updated</div>
                  <div>{reportMeta ? new Date(reportMeta.lastUpdated).toLocaleString() : ""}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-muted-foreground">Identity of the sender</div>
                  <div>{reportMeta?.reporterMode === "IDENTIFIED" ? "Identified" : "Anonymous"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-muted-foreground">Category</div>
                  <div>{reportMeta?.categoryName || "—"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-muted-foreground mb-1">Attachments</div>
                  <div className="space-y-1">
                    {attachments.length === 0 && <div className="text-sm text-muted-foreground">No attachments</div>}
                    {attachments.map(a => (
                      <div key={a.id} className="flex items-center justify-between rounded border px-2 py-1 text-sm">
                        <span className="truncate pr-2">{a.filename}</span>
                        <a href={a.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">Download</a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>
          <section className="md:col-span-2">
            <div className="rounded border">
              <div className="border-b p-3 font-medium">Messages</div>
              <div className="p-3 space-y-3 max-h-[60vh] overflow-auto">
                {messages.length === 0 && (
                  <div className="text-sm text-muted-foreground">No messages yet.</div>
                )}
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender === "REPORTER" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded px-3 py-2 text-sm ${m.sender === "REPORTER" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <div className="mb-1 text-xs opacity-80">
                        {m.sender === "REPORTER" ? "You" : "Handler"} • {new Date(m.createdAt).toLocaleString()}
                      </div>
                      <div className="whitespace-pre-wrap">{m.body}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t p-3 space-y-2">
                <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write a reply..." />
                <div className="flex items-center justify-end">
                  <Button onClick={sendMessage} disabled={!body.trim()}>Send</Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
