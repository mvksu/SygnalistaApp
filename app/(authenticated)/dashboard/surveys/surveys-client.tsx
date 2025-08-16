"use client"

import { CopyButton } from "@/components/ui/copy-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { useEffect, useState } from "react"
// Use API routes to avoid bundling Node modules in the client

export type Survey = {
  id: string
  title: string
  description?: string
  createdAt: string
  responses: Array<{ question: string; options: Array<{ label: string; count: number }> }>
}

function loadSurveys(orgId: string): Survey[] {
  if (typeof window === "undefined") return []
  const raw = window.localStorage.getItem(`surveys:${orgId}`)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Survey[]
  } catch {
    return []
  }
}

function saveSurveys(orgId: string, surveys: Survey[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(`surveys:${orgId}`, JSON.stringify(surveys))
}

function createId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export default function SurveysClient({ orgId, baseUrl }: { orgId?: string; baseUrl?: string }) {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [openNew, setOpenNew] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  type NewQuestion = { text: string; options: string[] }
  const [newQuestions, setNewQuestions] = useState<NewQuestion[]>([
    { text: "", options: ["Good", "Average", "Bad"] }
  ])
  const [selected, setSelected] = useState<Survey | null>(null)

  useEffect(() => {
    ;(async () => {
      const res = await fetch(`/api/surveys`, { cache: "no-store" })
      if (!res.ok) return
      const list: Array<{ id: string; title: string; description?: string; createdAt?: string }> = await res.json()
      setSurveys(list.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description || undefined,
        createdAt: s.createdAt || new Date().toISOString(),
        responses: []
      })))
    })()
  }, [orgId])

  async function handleCreate() {
    if (!title.trim()) return
    const prepared = newQuestions
      .map(q => ({
        question: q.text.trim(),
        options: q.options
          .map(o => o.trim())
          .filter(o => o.length > 0)
          .map(label => ({ label, count: 0 }))
      }))
      .filter(q => q.question.length > 0 && q.options.length >= 2)

    const payload = { title: title.trim(), description: description.trim() || undefined, questions: prepared.map(q => ({ text: q.question, options: q.options.map(o => o.label) })) }
    const resp = await fetch(`/api/surveys`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    if (!resp.ok) return
    const s: { id: string; title: string; description?: string; createdAt?: string } = await resp.json()
    setSurveys(prev => [
      {
        id: s.id,
        title: s.title,
        description: s.description || undefined,
        createdAt: s.createdAt?.toString?.() || new Date().toISOString(),
        responses: prepared
      },
      ...prev
    ])
    setOpenNew(false)
    setTitle("")
    setDescription("")
    setNewQuestions([{ text: "", options: ["Good", "Average", "Bad"] }])
  }

  function addQuestion() {
    setNewQuestions(prev => [...prev, { text: "", options: [""] }])
  }
  function removeQuestion(idx: number) {
    setNewQuestions(prev => prev.filter((_, i) => i !== idx))
  }
  function setQuestionText(idx: number, text: string) {
    setNewQuestions(prev => prev.map((q, i) => (i === idx ? { ...q, text } : q)))
  }
  function addOption(qIdx: number) {
    setNewQuestions(prev => prev.map((q, i) => (i === qIdx ? { ...q, options: [...q.options, ""] } : q)))
  }
  function removeOption(qIdx: number, oIdx: number) {
    setNewQuestions(prev => prev.map((q, i) => (i === qIdx ? { ...q, options: q.options.filter((_, j) => j !== oIdx) } : q)))
  }
  function setOption(qIdx: number, oIdx: number, value: string) {
    setNewQuestions(prev => prev.map((q, i) => (i === qIdx ? { ...q, options: q.options.map((o, j) => (j === oIdx ? value : o)) } : q)))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Surveys</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => setOpenNew(true)}>New survey</Button>
        </div>
      </div>

      <div className="rounded border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Title</th>
              <th className="p-2 text-left">Created</th>
              <th className="p-2 text-left">Share</th>
              <th className="p-2 text-left w-48">Actions</th>
            </tr>
          </thead>
          <tbody>
            {surveys.map(s => {
              const origin = typeof window !== "undefined" ? window.location.origin : (baseUrl || "")
              const shareUrl = `${origin}/s/${s.id}`
              return (
                <tr key={s.id} className="border-t">
                  <td className="p-2">
                    <div className="font-medium">{s.title}</div>
                    {s.description && (
                      <div className="text-muted-foreground text-xs">{s.description}</div>
                    )}
                  </td>
                  <td className="p-2">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">/s/{s.id}</span>
                      <CopyButton iconOnly className="rounded border px-1.5 py-1" text={shareUrl} />
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => setSelected(s)}>Summary</Button>
                      <Button variant="secondary" asChild>
                        <Link href={`#`}>Individual</Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {surveys.length === 0 && (
              <tr>
                <td className="p-4 text-muted-foreground" colSpan={4}>No surveys yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {openNew && (
        <div className="rounded-lg border p-4">
          <div className="text-base font-semibold">Create a new survey</div>
          <div className="mt-4 grid gap-3">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Company canteen" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" rows={3} />
            </div>
            <div className="space-y-3">
              <div className="text-sm font-medium">Questions</div>
              {newQuestions.map((q, qIdx) => (
                <div key={qIdx} className="rounded border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Question</label>
                      <Input value={q.text} onChange={e => setQuestionText(qIdx, e.target.value)} placeholder={`Question ${qIdx + 1}`} />
                    </div>
                    <Button variant="ghost" onClick={() => removeQuestion(qIdx)} disabled={newQuestions.length === 1}>Remove</Button>
                  </div>
                  <div className="mt-3 space-y-2">
                    <label className="text-xs text-muted-foreground">Options (minimum 2)</label>
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <Input value={opt} onChange={e => setOption(qIdx, oIdx, e.target.value)} placeholder={`Option ${oIdx + 1}`} />
                        <Button variant="outline" onClick={() => removeOption(qIdx, oIdx)} disabled={q.options.length <= 1}>Delete</Button>
                      </div>
                    ))}
                    <Button variant="secondary" onClick={() => addOption(qIdx)}>Add option</Button>
                  </div>
                </div>
              ))}
              <Button onClick={addQuestion}>Add question</Button>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleCreate}>Create</Button>
              <Button variant="outline" onClick={() => setOpenNew(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-semibold">Summary results</div>
              <div className="text-muted-foreground text-xs">{selected.title}</div>
            </div>
            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {selected.responses.map((q, idx) => (
              <div key={idx} className="rounded border p-4">
                <div className="text-sm font-medium">{idx + 1}. {q.question}</div>
                <div className="mt-4 space-y-3">
                  {q.options.map((opt, i) => {
                    const total = q.options.reduce((n, o) => n + o.count, 0) || 1
                    const pct = Math.round((opt.count / total) * 100)
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>{opt.label}</span>
                          <span className="text-muted-foreground">{opt.count} ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded bg-muted">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


