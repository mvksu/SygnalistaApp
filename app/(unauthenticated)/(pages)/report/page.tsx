"use client"

import ReportForm from "@/components/report/report-form"
import ReceiptModal from "@/components/report/receipt-modal"
import { useState, useEffect } from "react"

export default function ReportPage() {
  const [receipt, setReceipt] = useState<{ code: string; passphrase: string; feedbackDueAt?: string | null } | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams(window.location.search)
        const channel = params.get("channel")
        const org = params.get("org")
        const query = channel ? `?channel=${encodeURIComponent(channel)}` : org ? `?org=${encodeURIComponent(org)}` : ""
        const resp = await fetch(`/api/report-categories${query}`)
        if (resp.ok) {
          const data = await resp.json()
          setCategories(data)
        }
      } catch (e) {
        console.error("Failed to load categories", e)
      }
    }
    load()
  }, [])

  async function handleSubmit(formData: any) {
    const resp = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      throw new Error(err.error || "Failed to submit report")
    }
    const data = await resp.json()
    setReceipt({ code: data.caseId || data.receiptCode, passphrase: data.caseKey || data.passphrase, feedbackDueAt: data.feedbackDueAt })
  }

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""

  return (
    <div className="container mx-auto max-w-3xl py-10">
      <h1 className="text-2xl font-semibold mb-6">Submit a Report</h1>
      <ReportForm
        categories={categories}
        captchaSiteKey={siteKey}
        onSubmit={handleSubmit}
      />
      <p className="mt-4 text-sm text-muted-foreground">You can submit anonymously. Your identity will not be stored unless you choose to provide contact information.</p>
      <ReceiptModal
        open={!!receipt}
        onClose={() => setReceipt(null)}
        receiptCode={receipt?.code || ""}
        passphrase={receipt?.passphrase || ""}
        feedbackDueAt={receipt?.feedbackDueAt || null}
      />
    </div>
  )
}


