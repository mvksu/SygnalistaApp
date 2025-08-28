'use client'

import { useRef } from 'react'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'
import { Button } from 'tweakcn/ui/button'
import { ExternalLink, Printer, Download, Share2 } from 'lucide-react'

export type PosterDialogProps = {
  orgName: string
  orgLogoUrl?: string | null
  link: string
  qrDataUrl: string
}

export default function PosterDialog({ orgName, orgLogoUrl, link, qrDataUrl }: PosterDialogProps) {
  const posterRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (!posterRef.current) return
    const printWindow = window.open('', '', 'height=800,width=600')
    if (!printWindow) return
    printWindow.document.write(`<!doctype html><html><head>${document.head.innerHTML}</head><body>${posterRef.current.outerHTML}</body></html>`)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  const handleDownload = async () => {
    if (!posterRef.current) return
    const htmlToImage = await import('html-to-image')
    const dataUrl = await htmlToImage.toPng(posterRef.current)
    const linkEl = document.createElement('a')
    linkEl.href = dataUrl
    linkEl.download = 'poster.png'
    linkEl.click()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: orgName, url: link })
      } catch (err) {
        console.error(err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(link)
        alert('Link copied to clipboard')
      } catch (err) {
        console.error(err)
      }
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="inline-flex items-center gap-1 rounded border px-2 py-1">
          <ExternalLink className="h-4 w-4" />
          <span>Open poster</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <div className="space-y-6">
          <div ref={posterRef} className="bg-card rounded-lg p-8 shadow-lg">
            <div className="mb-6 flex items-center gap-4">
              {orgLogoUrl && <img src={orgLogoUrl} alt="Logo" className="h-14 w-auto object-contain" />}
              <h1 className="text-2xl font-bold">{orgName} – Whistleblower Channel</h1>
            </div>
            <p className="mb-8 text-muted-foreground">
              Help spread awareness about the internal reporting channel. Scan the QR code or visit the link below to access the
              secure portal. You can report serious matters confidentially or 100% anonymously.
            </p>
            <div className="mb-6 flex justify-center">
              <img src={qrDataUrl} alt="QR code" className="h-48 w-48" />
            </div>
            <p className="mb-4 text-center text-sm text-muted-foreground">Direct link: {link}</p>
          </div>
          <div className="flex justify-end gap-2 print:hidden">
            <Button onClick={handlePrint} size="sm" variant="outline">
              <Printer className="mr-1 h-4 w-4" /> Print
            </Button>
            <Button onClick={handleDownload} size="sm" variant="outline">
              <Download className="mr-1 h-4 w-4" /> Download
            </Button>
            <Button onClick={handleShare} size="sm" variant="outline">
              <Share2 className="mr-1 h-4 w-4" /> Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

