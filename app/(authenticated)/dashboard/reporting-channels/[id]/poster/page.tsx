

import { db } from "@/db"
import { reportingChannels } from "@/db/schema/reportingChannels"
import { organizations } from "@/db/schema/organizations"
import { eq } from "drizzle-orm"
import { Button } from "tweakcn/ui/button"

export default async function PosterPage({ params }: { params: { id: string } }) {
  const channel = await db.query.reportingChannels.findFirst({ where: eq(reportingChannels.id, params.id) })
  if (!channel) return null
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, channel.orgId) })

  const base = process.env.NEXT_PUBLIC_BASE_URL || ""
  const link = `${base}/secure/${channel.slug}`

  const QR = await import("qrcode")
  const qrDataUrl = await QR.toDataURL(link, { margin: 2, width: 600 })

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col">
        <h1>Poster – {org?.name}</h1>
      </div>
      <div className="container mx-auto py-6">
        <div className="no-print flex justify-center mb-6">
          <a 
            href={`/dashboard/reporting-channels/${channel.id}`}
            className="btn btn-secondary mr-2"
          >
            Back
          </a>
          <Button className="btn btn-primary" variant="primary" size="sm">
            <span>Print</span>
          </Button>
        </div>
        <div className="page bg-card rounded-lg shadow-lg p-8 max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            {org?.logoUrl && (
              <img 
                src={org.logoUrl} 
                alt="Logo" 
                className="h-14 w-auto object-contain"
              />
            )}
            <h1 className="text-3xl font-bold text-foreground">
              {org?.name} – Whistleblower Channel
            </h1>
          </div>
          <p className="text-lg text-muted-foreground mb-8">
            Help spread awareness about the internal reporting channel. Scan the QR code or visit the link below to
            access the secure portal. You can report serious matters confidentially or 100% anonymously.
          </p>
          <div className="flex justify-center mb-6">
            <img 
              src={qrDataUrl} 
              alt="QR code" 
              className="w-72 h-72"
            />
          </div>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Direct link: {link}
          </p>
          <div className="border-t pt-4 text-sm text-muted-foreground italic">
            Post this in common areas (kitchen, entrance, intranet). Consider including guidance on examples and scope.
          </div>
        </div>
      </div>
    </div>
  )
}


