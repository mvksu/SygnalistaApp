import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { reportingChannels } from "@/db/schema/reportingChannels"
import { organizations } from "@/db/schema/organizations"
import { eq } from "drizzle-orm"
import Link from "next/link"
import { setChannelDefaultLanguage, deleteReportingChannelAction } from "@/actions/reporting-channels"
import { CopyButton } from "@/components/ui/copy-button"
import { Link as LinkIcon, ExternalLink, Copy as CopyIcon, Image as ImageIcon } from "lucide-react"
import { clerkClient } from "@clerk/nextjs/server"
import { Button } from "tweakcn/ui/button"

export default async function ReportingChannelDetail({ params }: { params: Promise<{ id: string }> }) {
	const { orgId: clerkOrgId } = await auth()
	if (!clerkOrgId) return null
	const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
	const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)

	const channel = await db.query.reportingChannels.findFirst({ where: eq(reportingChannels.id, (await params).id) })
	if (!channel || channel.orgId !== orgId) return null
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) })
  
  const cc = await clerkClient()
  const orgImg = await cc.organizations.getOrganization({
    organizationId: clerkOrgId
  })
  const orgImgUrl = orgImg.imageUrl


	return (
    <div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">{channel.name}</h1>
				<div className="flex items-center gap-2">
					<Link href="/dashboard/reporting-channels" className="text-sm text-muted-foreground">Back</Link>
				</div>
			</div>
        <div className="space-y-4">
          <div className="flex items-center gap-4 border-b">
            <Button className="border-b-2 border-primary font-medium" variant="link" size="sm">
              Links
            </Button>
            <Button className="text-muted-foreground" variant="link" size="sm" disabled>
              Phone hotline
            </Button>
            <Button className="text-muted-foreground" variant="link" size="sm" disabled>
              Email
            </Button>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded border p-4 space-y-3">
                    <div className="aspect-[4/3] w-full overflow-hidden rounded border">
                      <iframe src={`/reporting-channel/${channel.slug}`} className="h-full w-full" />
                    </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <LinkIcon className="h-4 w-4" />
                                <span>Open page</span>
                            </div>
                            <Link href={`/reporting-channel/${channel.slug}`} className="inline-flex items-center gap-1 rounded border px-2 py-1">
                                <ExternalLink className="h-4 w-4" />
                                <span>Open page</span>
                            </Link>
                        </div>
                    <div className="flex items-center justify-between text-sm">
                        <div className="text-muted-foreground">Poster promotion</div>
                        <Link href={`/dashboard/reporting-channels/${channel.id}/poster`} className="inline-flex items-center gap-1 rounded border px-2 py-1">
                            <ExternalLink className="h-4 w-4" />
                            <span>Open poster</span>
                        </Link>
                    </div>
                </div>
				<div className="space-y-6">
					<div className="rounded border">
						<div className="border-b p-4 font-medium">Customize your reporting channel</div>
						<div className="p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span>Organization logo</span>
              </div>
              <div className="flex items-center gap-2">
                {orgImgUrl ? (
                  <img src={orgImgUrl} alt="Organization logo" className="h-8 w-8 rounded object-cover" />
                ) : (
                  <span className="text-muted-foreground text-xs">No logo uploaded</span>
                )}
                <form action={async (formData: FormData) => {"use server"}} className="flex items-center gap-2">
                  <input type="file" name="logo" accept="image/*" className="text-xs" />
                  <Button type="submit" className="px-2 py-1" variant="primary" size="sm">
                    Upload
                  </Button>
                </form>
              </div>
            </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <LinkIcon className="h-4 w-4" />
                                <span>Reporting link</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono">/secure/{channel.slug}</span>
                                <CopyButton iconOnly className="rounded border px-2 py-1" text={`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/secure/${channel.slug}`} />
                            </div>
                        </div>
							<div className="flex items-center justify-between">
								<div className="text-muted-foreground">Default language</div>
                            <form action={setChannelDefaultLanguage} className="flex items-center gap-2">
                                <input type="hidden" name="id" value={channel.id} />
                                <select name="defaultLanguage" defaultValue={channel.defaultLanguage} className="rounded border px-2 py-1">
                                    <option value="auto">Auto detection</option>
                                    <option value="en">English</option>
                                    <option value="pl">Polski</option>
                                </select>
                                <Button type="submit" className="px-2 py-1" variant="primary" size="sm">
                                  Save
                                </Button>
                            </form>
							</div>
						</div>
					</div>
					<div className="rounded border">
						<div className="border-b p-4 font-medium">Link settings</div>
						<div className="p-4 space-y-3 text-sm">
							<div className="grid gap-2">
								<label className="text-muted-foreground">Name</label>
								<div>{channel.name}</div>
							</div>
							<div className="grid gap-2">
								<label className="text-muted-foreground">Link suffix</label>
								<div className="font-mono">{channel.slug}</div>
							</div>
                        <form action={deleteReportingChannelAction} className="pt-2">
                            <input type="hidden" name="id" value={channel.id} />
                            <Button type="submit" className="px-3 py-2 text-sm" variant="destructive" size="sm">
                              Delete channel
                            </Button>
                        </form>
						</div>
					</div>
				</div>
		</div>
    </div>
	)
}


