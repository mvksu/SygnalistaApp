import { OrganizationList, OrganizationProfile, CreateOrganization, OrganizationSwitcher } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function OrgSetupPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect("/login")
  if (orgId) redirect("/dashboard")

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Set up your organization</h1>
      <p className="text-sm text-muted-foreground">Create or join an organization to continue.</p>
      <div className="grid gap-6">
        <div className="rounded-md border p-4">
          <h2 className="mb-2 font-medium">Your organizations</h2>
          <OrganizationList hidePersonal />
        </div>
        <div className="rounded-md border p-4">
          <h2 className="mb-2 font-medium">Create a new organization</h2>
          <CreateOrganization afterCreateOrganizationUrl="/dashboard" />
        </div>
      </div>
    </div>
  )
}


