import { db } from "@/db"
import { reportingChannels } from "@/db/schema/reportingChannels"
import { organizations } from "@/db/schema/organizations"
import { eq } from "drizzle-orm"
import ReportLandingClient from "./client-landing"
import { reportCategories } from "@/db/schema/reportCategories"

export default async function PublicReportLanding({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const channel = await db.query.reportingChannels.findFirst({ where: eq(reportingChannels.slug, slug) })
  if (!channel) return null
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, channel.orgId) })
  const categories = await db
    .select({ id: reportCategories.id, name: reportCategories.name })
    .from(reportCategories)
    .where(eq(reportCategories.orgId, channel.orgId))

  return (
    <div className="container mx-auto max-w-3xl py-10">
      {(() => {
        const provider = (process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER as "turnstile" | "hcaptcha") || "hcaptcha"
        const siteKey = "hcaptcha"
        return (
      <ReportLandingClient
        orgName={org?.name || "Organization"}
        channelSlug={channel.slug}
        categories={categories}
        captchaSiteKey={siteKey}
        captchaProvider={provider}
      />
        )
      })()}
    </div>
  )
}


