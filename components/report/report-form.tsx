"use client"

import { useMemo, useState } from "react"
import { z } from "zod"
import { reportIntakeSchema, type ReportIntake } from "@/lib/validation/report"
import { Captcha } from "@/components/captcha"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

type Props = {
  categories: { id: string; name: string }[]
  captchaProvider?: "turnstile" | "hcaptcha"
  captchaSiteKey: string
  onSubmit: (data: ReportIntake) => Promise<void>
}

export default function ReportForm({ categories, captchaProvider = "turnstile", captchaSiteKey, onSubmit }: Props) {
  const [values, setValues] = useState<ReportIntake>({
    categoryId: "",
    body: "",
    anonymous: true,
    contact: undefined,
    attachments: [],
    captchaToken: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const validator = useMemo(() => reportIntakeSchema, [])

  function setField<K extends keyof ReportIntake>(key: K, value: ReportIntake[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    const parsed = validator.safeParse(values)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".") || "form"
        if (!fieldErrors[path]) fieldErrors[path] = issue.message
      }
      setErrors(fieldErrors)
      setSubmitting(false)
      return
    }

    try {
      await onSubmit(parsed.data)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <select
          className="w-full border rounded-md px-2 py-2"
          value={values.categoryId}
          onChange={(e) => setField("categoryId", e.target.value)}
        >
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors["categoryId"] && <p className="text-sm text-red-600">{errors["categoryId"]}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Details</label>
        <Textarea
          value={values.body}
          onChange={(e) => setField("body", e.target.value)}
          placeholder="Describe the issue..."
          rows={6}
        />
        {errors["body"] && <p className="text-sm text-red-600">{errors["body"]}</p>}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="anonymous"
          type="checkbox"
          checked={values.anonymous}
          onChange={(e) => setField("anonymous", e.target.checked)}
        />
        <label htmlFor="anonymous">Submit anonymously</label>
      </div>

      {!values.anonymous && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email (optional)</label>
            <Input
              type="email"
              value={values.contact?.email || ""}
              onChange={(e) => setField("contact", { ...values.contact, email: e.target.value })}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone (optional)</label>
            <Input
              value={values.contact?.phone || ""}
              onChange={(e) => setField("contact", { ...values.contact, phone: e.target.value })}
              placeholder="+48 123 456 789"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">CAPTCHA</label>
        <Captcha
          provider={captchaProvider}
          siteKey={captchaSiteKey}
          onVerify={(token) => setField("captchaToken", token)}
        />
        {errors["captchaToken"] && <p className="text-sm text-red-600">{errors["captchaToken"]}</p>}
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit report"}
      </Button>
    </form>
  )
}


