import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { reportingChannels } from "@/db/schema/reportingChannels"
import Link from "next/link"
import { eq, and } from "drizzle-orm"

async function createDefaultChannel(orgId: string) {
	// Check existing default 'links' channel for org to avoid unique constraint error
	const existing = await db.query.reportingChannels.findFirst({ where: and(eq(reportingChannels.orgId, orgId), eq(reportingChannels.type, "links")) })
	if (existing) return existing

	const slug = crypto.randomUUID()
	try {
		const [inserted] = await db
			.insert(reportingChannels)
			.values({ orgId, name: "Default", slug, defaultLanguage: "auto" })
			.returning()
		return inserted
	} catch (e) {
		// In case of race condition, fetch and return the existing
		const fallback = await db.query.reportingChannels.findFirst({ where: and(eq(reportingChannels.orgId, orgId), eq(reportingChannels.type, "links")) })
		if (fallback) return fallback
		throw e
	}
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


