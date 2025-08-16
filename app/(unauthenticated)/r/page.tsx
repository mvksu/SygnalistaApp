"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CheckCasePage() {
  const [receipt, setReceipt] = useState("")
  const [passphrase, setPassphrase] = useState("")
  const router = useRouter()
  return (
    <div className="container mx-auto max-w-md space-y-4 py-10">
      <h1 className="text-2xl font-semibold">Check Case</h1>
      <p className="text-muted-foreground text-sm">Enter your case ID and case key to open your secure inbox.</p>
      <div className="space-y-2">
        <label className="text-sm font-medium">Case ID</label>
        <input
          value={receipt}
          onChange={e => setReceipt(e.target.value)}
          className="w-full rounded border px-2 py-2"
          placeholder="e.g. ABCD-EFGH-..."
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Case key</label>
        <input
          value={passphrase}
          onChange={e => setPassphrase(e.target.value)}
          className="w-full rounded border px-2 py-2"
          placeholder="Your passphrase"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => {
            if (!receipt) return
            window.location.href = `/r/${encodeURIComponent(receipt)}?caseKey=${encodeURIComponent(passphrase)}`
          }}
        >
          Open
        </Button>
        <Link
          href="#"
          onClick={e => {
            e.preventDefault()
            router.back()
          }}
          className="text-sm underline"
        >
          Back to homepage
        </Link>
      </div>
    </div>
  )
}


