"use client"

import { CheckCircle2, Copy, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/ui/copy-button"
import { useParams } from "next/navigation"

type Props = { params: Promise<{ code: string; caseKey: string }> }

export default function ReceiptView({ params }: Props) {
  const pm = useParams<{ code: string; caseKey: string }>()
  const { code, caseKey } = pm

  return (
    <div className="container mx-auto max-w-3xl py-10">
      <div className="mb-4 flex items-center gap-2 text-green-600">
        <CheckCircle2 className="h-5 w-5" />
        <span className="text-sm font-medium">Case was sent</span>
      </div>

      <h1 className="mb-2 text-2xl font-semibold">Your Case</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Store this code safely. Use it with your case key to access your secure
        inbox later.
      </p>

      <div className="rounded-md border p-4">
        <div className="text-muted-foreground text-xs uppercase">Case ID</div>
        <div className="font-mono text-lg break-all">{code}</div>
      </div>
      <div className="rounded-md border p-4 mt-4">
        <div className="text-muted-foreground text-xs uppercase">Case Key</div>
        <div className="font-mono text-lg break-all">{code}</div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          Keep your passphrase private. We cannot recover it if lost.
        </div>
        <ReceiptActions code={code} />
      </div>
    </div>
  )
}

function ReceiptActions({ code }: { code: string }) {
  async function handleCopy() {
    const passphrase =
      new URLSearchParams(window.location.search).get("caseKey") ||
      new URLSearchParams(window.location.search).get("passphrase") || ""
    const text = `Case ID: ${code}${passphrase ? `\nCase key: ${passphrase}` : ""}`
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // ignore
    }
  }

  function handleDownload() {
    const passphrase =
      new URLSearchParams(window.location.search).get("caseKey") ||
      new URLSearchParams(window.location.search).get("passphrase") || ""
    const content = `Case ID: ${code}${passphrase ? `\nCase key: ${passphrase}` : ""}\nSaved: ${new Date().toISOString()}`
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `case-${code}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex items-center gap-2">
      <CopyButton variant="secondary" type="button" onClick={handleCopy}>
        <Copy className="mr-2 h-4 w-4" /> Copy
      </CopyButton>
      <Button type="button" onClick={handleDownload}>
        <Download className="mr-2 h-4 w-4" /> Download
      </Button>
    </div>
  )
}
