"use client"

import { useState } from "react"
import { Button } from "tweakcn/ui/button"

function StepHeader({ step, setStep }: { step: number; setStep: (n: number) => void }) {
  return (
    <div className="flex items-center gap-4 border-b pb-2">
      {["Welcome", "Survey", "Thank you"].map((label, i) => (
        <Button
          key={label}
          className={`text-sm ${step === i ? "font-semibold" : "text-muted-foreground"}`}
          onClick={() => setStep(i)}
          variant="link"
          size="sm"
        >
          {i + 1}. {label}
        </Button>
      ))}
    </div>
  )
}

export default function NewSurveyWizard({ orgId }: { orgId: string }) {
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState("")
  const [welcome, setWelcome] = useState("Welcome to our survey. Your input helps us improve.")
  const [thankyou, setThankyou] = useState("Thank you for your time!")
  const [questions, setQuestions] = useState<Array<{ text: string; type: string }>>([{ text: "", type: "single" }])
  const [openShare, setOpenShare] = useState(false)
  const [shareId, setShareId] = useState<string | null>(null)

  async function saveSurvey() {
    const payload = {
      title,
      meta: { welcome, thankyou },
      questions: questions.map((q, idx) => ({ idx, text: q.text, type: q.type }))
    }
    const res = await fetch("/api/surveys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    if (res.ok) {
      const data = await res.json()
      setShareId(data?.id || null)
      setOpenShare(true)
    }
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 py-6">
      <h1 className="text-2xl font-semibold">Create survey</h1>
      <StepHeader step={step} setStep={setStep} />

      {step === 0 && (
        <div className="space-y-4">
          <div className="grid gap-1">
            <label className="text-sm text-muted-foreground">Survey name</label>
            <input className="rounded border px-2 py-2" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Company canteen" />
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-muted-foreground">Welcome text</label>
            <textarea className="min-h-24 rounded border px-2 py-2" value={welcome} onChange={e=>setWelcome(e.target.value)} />
          </div>
          <div className="text-sm text-muted-foreground">Organization logo will be shown automatically.</div>
          <div className="flex items-center gap-2">
            <Button onClick={()=>setStep(1)}>Next</Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="rounded border p-3">
              <div className="grid gap-2">
                <input className="rounded border px-2 py-1" value={q.text} onChange={e=>setQuestions(prev=>prev.map((p,idx)=> idx===i?{...p,text:e.target.value}:p))} placeholder={`Question ${i+1}`} />
                <select className="max-w-xs rounded border px-2 py-1" value={q.type} onChange={e=>setQuestions(prev=>prev.map((p,idx)=> idx===i?{...p,type:e.target.value}:p))}>
                  <option value="single">Single choice</option>
                  <option value="multi">Multiple choice</option>
                  <option value="short">Short answer</option>
                  <option value="rating">Star rating</option>
                </select>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={()=>setQuestions(prev=>[...prev,{text:"",type:"single"}])}>Add question</Button>
            <Button onClick={()=>setStep(2)}>Next</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="grid gap-1">
            <label className="text-sm text-muted-foreground">Thank you text</label>
            <textarea className="min-h-24 rounded border px-2 py-2" value={thankyou} onChange={e=>setThankyou(e.target.value)} />
          </div>
          <div className="text-sm text-muted-foreground">Organization logo will be shown automatically.</div>
          <div className="flex items-center gap-2">
            <Button onClick={saveSurvey}>Save & Share</Button>
          </div>
        </div>
      )}

      {openShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setOpenShare(false)} />
          <div className="relative z-10 w-[90vw] max-w-lg rounded-md bg-card p-4 shadow-xl">
            <div className="text-base font-semibold">Share survey</div>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground text-xs uppercase">Link</div>
                <input className="w-full rounded border px-2 py-1" readOnly value={`${window.location.origin}/s/${shareId || "NEW_ID"}`} />
              </div>
              <div>
                <div className="text-muted-foreground text-xs uppercase">QR</div>
                <div className="rounded border p-6 text-center text-xs text-muted-foreground">QR will appear here</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs uppercase">Email</div>
                <input className="w-full rounded border px-2 py-1" placeholder="Enter emails separated by comma" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end">
              <Button onClick={()=>setOpenShare(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



