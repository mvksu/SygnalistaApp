import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { reportingChannels } from "@/db/schema/reportingChannels"
import { eq } from "drizzle-orm"
import Link from "next/link"
import { CopyButton } from "@/components/ui/copy-button"
import { Link as LinkIcon, ExternalLink, QrCode } from "lucide-react"

export default async function ReportingChannelsPage() {
	const { orgId: clerkOrgId } = await auth()
	if (!clerkOrgId) return null
	const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
    const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
    const { ensureDefaultReportingChannel } = await import("@/src/server/services/register")
    await ensureDefaultReportingChannel(orgId)

	const channels = await db.query.reportingChannels.findMany({ where: eq(reportingChannels.orgId, orgId) })

	return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b">
        <button className="border-b-2 border-primary px-3 py-2 text-sm font-medium">Links</button>
        <button className="px-3 py-2 text-sm text-muted-foreground" disabled>Phone hotline</button>
        <button className="px-3 py-2 text-sm text-muted-foreground" disabled>Email</button>
      </div>
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">Reporting channels</h1>
				<Link href="/dashboard/reporting-channels/new" className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Add new</Link>
			</div>
            <div className="rounded border">
				<table className="w-full text-sm">
					<thead className="bg-muted">
						<tr>
							<th className="p-2 text-left">Name</th>
                            <th className="p-2 text-left">Link</th>
							<th className="p-2 text-left">Default language</th>
                            <th className="p-2 text-left">Poster</th>
                            <th className="p-2 text-left w-24"></th>
						</tr>
					</thead>
					<tbody>
						{channels.map(ch => (
							<tr key={ch.id} className="border-t">
								<td className="p-2">{ch.name}</td>
                                <td className="p-2">
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <LinkIcon className="h-4 w-4" />
                                    <Link href={`/dashboard/reporting-channels/${ch.id}`} className="font-mono text-primary hover:underline">
                                      /secure/{ch.slug}
                                    </Link>
                                    <CopyButton iconOnly className="rounded border px-1.5 py-1" text={`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/secure/${ch.slug}`} />
                                  </div>
                                </td>
                                <td className="p-2">{ch.defaultLanguage}</td>
                                <td className="p-2">
                                  <Link href={`/dashboard/reporting-channels/${ch.id}/poster`} className="inline-flex items-center gap-1 text-primary">
                                    <QrCode className="h-4 w-4" />
                                    Poster
                                  </Link>
                                </td>
                                <td className="p-2">
                                  <Link href={`/dashboard/reporting-channels/${ch.id}`} className="inline-flex items-center gap-1 text-primary">
                                    <ExternalLink className="h-4 w-4" />
                                    Open
                                  </Link>
                                </td>
							</tr>
						))}
						{channels.length === 0 && (
							<tr>
								<td className="p-4 text-muted-foreground" colSpan={4}>No channels yet.</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	)
}


