"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

type ThreadMessage = { id: string; sender: "REPORTER" | "HANDLER"; body: string; createdAt: string }

export default function ReporterInboxPage({ params }: { params: { receipt: string } }) {
  const receipt = params.receipt
  const [passphrase, setPassphrase] = useState("")
  const [unlocked, setUnlocked] = useState(false)
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [body, setBody] = useState("")
  const [captchaToken, setCaptchaToken] = useState("")

  async function unlock() {
    const resp = await fetch(`/api/inbox/${encodeURIComponent(receipt)}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseKey: passphrase, captchaToken }),
    })
    if (!resp.ok) throw new Error("Invalid case id or case key")
    setUnlocked(true)
    await loadThread()
  }

  async function loadThread() {
    const resp = await fetch(`/api/inbox/${encodeURIComponent(receipt)}/messages`, {
      headers: { "x-passphrase": passphrase },
    })
    if (!resp.ok) throw new Error("Failed to load thread")
    const data = await resp.json()
    setMessages(
      (data.messages as any[]).map((m) => ({ id: m.id, sender: m.sender, body: m.body, createdAt: m.createdAt }))
    )
  }

  async function sendMessage() {
    const resp = await fetch(`/api/inbox/${encodeURIComponent(receipt)}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passphrase, body, captchaToken }),
    })
    if (!resp.ok) throw new Error("Failed to send")
    setBody("")
    await loadThread()
  }

  return (
    <div className="container mx-auto max-w-3xl py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Secure Inbox</h1>
      {!unlocked ? (
        <div className="space-y-4">
          <div>
            <div className="text-sm mb-1">Case ID</div>
            <Input value={receipt} disabled />
          </div>
          <div>
            <div className="text-sm mb-1">Case key</div>
            <Input value={passphrase} onChange={(e) => setPassphrase(e.target.value)} type="password" />
          </div>
          {/* Reuse Captcha component from earlier if needed in UI */}
          <Button onClick={unlock}>Unlock</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {messages.map((m) => (
              <div key={m.id} className="rounded border p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  {m.sender} • {new Date(m.createdAt).toLocaleString()}
                </div>
                <div className="whitespace-pre-wrap">{m.body}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a reply..." />
            {/* Reuse Captcha component */}
            <Button onClick={sendMessage}>Send</Button>
          </div>
        </div>
      )}
    </div>
  )
}


