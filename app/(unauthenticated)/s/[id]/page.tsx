"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
// Use API routes to keep client bundle browser-safe

export default function PublicSurveyPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const surveyId = params?.id
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    survey: { id: string; title: string; description?: string }
    questions: Array<{ id: string; question: string; options: Array<{ id: string; label: string }> }>
  } | null>(null)
  const [answers, setAnswers] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    ;(async () => {
      if (!surveyId) return
      const res = await fetch(`/api/surveys/${String(surveyId)}`, { cache: "no-store" })
      if (res.ok) {
        const json = await res.json()
        setData(json)
        setAnswers(json ? new Array(json.questions.length).fill("") : [])
      } else {
        setData(null)
      }
      setLoading(false)
    })()
  }, [surveyId])

  function selectAnswer(qIdx: number, optionId: string) {
    setAnswers(prev => prev.map((v, i) => (i === qIdx ? optionId : v)))
  }

  async function handleSubmit() {
    if (!data) return
    const payload = { answers: data.questions.map((q, i) => ({ questionId: q.id, optionId: answers[i]! })) }
    await fetch(`/api/surveys/${data.survey.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    setSubmitted(true)
  }

  if (loading) {
    return <div className="mx-auto max-w-2xl p-6 text-sm text-muted-foreground">Loading survey…</div>
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <h1 className="text-2xl font-semibold">Survey not found</h1>
        <Button onClick={() => router.push("/")}>Go home</Button>
      </div>
    )
  }
  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <h1 className="text-2xl font-semibold">Thank you for your response</h1>
        <p className="text-muted-foreground">Your answers have been recorded anonymously.</p>
        <Button onClick={() => router.push("/")}>Close</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">{data.survey.title}</h1>
        {data.survey.description && (
          <p className="text-muted-foreground mt-1 text-sm">{data.survey.description}</p>
        )}
      </div>

      <form
        onSubmit={e => {
          e.preventDefault()
          handleSubmit()
        }}
        className="space-y-6"
      >
        {data.questions.map((q, qIdx) => (
          <div key={q.id} className="rounded border p-4">
            <div className="text-sm font-medium">{qIdx + 1}. {q.question}</div>
            <div className="mt-3 space-y-2">
              {q.options.map(opt => (
                <label key={opt.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`q-${qIdx}`}
                    checked={answers[qIdx] === opt.id}
                    onChange={() => selectAnswer(qIdx, opt.id)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={answers.some(a => !a)}>Submit</Button>
          {answers.some(a => !a) && <span className="text-muted-foreground text-xs">Please answer all questions</span>}
        </div>
        <p className="text-muted-foreground text-xs">Responses are anonymous. No personal data is collected on this page.</p>
      </form>
    </div>
  )
}



