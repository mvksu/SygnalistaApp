"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"

type Props = {
  open: boolean
  onClose: () => void
  receiptCode: string
  passphrase: string
  feedbackDueAt?: string | Date | null
}

export default function ReceiptModal({ open, onClose, receiptCode, passphrase, feedbackDueAt }: Props) {
  const feedbackDue = useMemo(() => (feedbackDueAt ? new Date(feedbackDueAt).toLocaleDateString() : null), [feedbackDueAt])
  if (!open) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`Case ID: ${receiptCode}\nCase key: ${passphrase}`)
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-md bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-2">Save your case ID and case key</h2>
        <p className="text-sm text-muted-foreground mb-4">
          You will need these to access your secure inbox. Store them safely. We cannot recover the passphrase.
        </p>

        <div className="space-y-3">
          <div>
            <div className="text-xs uppercase text-muted-foreground">Case ID</div>
            <div className="font-mono text-lg break-all">{receiptCode}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground">Case key (shown once)</div>
            <div className="font-mono text-lg break-all">{passphrase}</div>
          </div>
          {feedbackDue && (
            <div className="text-sm text-muted-foreground">Feedback due by: {feedbackDue}</div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button variant="secondary" type="button" onClick={handleCopy}>Copy</Button>
            <Button variant="secondary" type="button" onClick={() => window.print()}>Print</Button>
          </div>
          <Button
            type="button"
            onClick={() => {
              try {
                const url = `/receipt/${encodeURIComponent(receiptCode)}?passphrase=${encodeURIComponent(passphrase)}`
                window.location.href = url
              } catch {
                onClose()
              }
            }}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}


