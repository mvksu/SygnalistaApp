import { auth } from "@clerk/nextjs/server"
import WizardClient from "./wizard-client"

export default async function NewReportingChannelPage() {
	const { orgId: clerkOrgId } = await auth()
	if (!clerkOrgId) return null

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-semibold">Create reporting channel</h1>
			<WizardClient />
		</div>
	)
}


