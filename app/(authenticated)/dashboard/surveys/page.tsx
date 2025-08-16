import { auth } from "@clerk/nextjs/server"
import SurveysClient from "./surveys-client"
import { getDbOrgIdForClerkOrg } from "@/src/server/orgs"

export default async function SurveysPage() {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return null
  const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""

  return (
    <div className="space-y-6">
      <SurveysClient orgId={orgId} baseUrl={baseUrl} />
    </div>
  )
}
