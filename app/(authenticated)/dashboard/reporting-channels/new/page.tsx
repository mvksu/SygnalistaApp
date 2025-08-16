import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { reportingChannels } from "@/db/schema/reportingChannels"
import Link from "next/link"

async function createDefaultChannel(orgId: string) {
	const slug = crypto.randomUUID()
	const [inserted] = await db
		.insert(reportingChannels)
		.values({ orgId, name: "Default", slug, defaultLanguage: "auto" })
		.returning()
	return inserted
}

export default async function NewReportingChannelPage() {
	const { orgId: clerkOrgId } = await auth()
	if (!clerkOrgId) return null
	const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
	const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)

	const channel = await createDefaultChannel(orgId)

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-semibold">Reporting channels</h1>
			<div className="rounded border p-4 text-sm">
				Created new channel <span className="font-medium">{channel.name}</span>. {" "}
				<Link href={`/dashboard/reporting-channels/${channel.id}`} className="text-primary">Open page</Link>
			</div>
		</div>
	)
}


