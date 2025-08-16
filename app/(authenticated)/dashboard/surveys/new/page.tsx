import { auth } from "@clerk/nextjs/server"
import { getDbOrgIdForClerkOrg } from "@/src/server/orgs"
import NewSurveyWizard from "./wizard-client"

export default async function NewSurveyWizardPage() {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return null
  const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
  return <NewSurveyWizard orgId={orgId} />
}


