import { getCustomerByUserId } from "@/actions/customers"
import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import DashboardClientLayout from "./_components/layout-client"
import { getOrganizationSubscription } from "@/actions/organizations"

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { userId, orgId } = await auth() 

  const user = await currentUser() 

  if (!userId) {
    redirect("/login")
  }

  // Require an active organization context before accessing dashboard
  if (!orgId) {
    redirect("/org-setup")
  }

  // Optional plan gating removed to avoid redirecting away from dashboard/account

  if (!user) {
    redirect("/login")
  }

  const userData = {
    name:
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.username || "User",
    email: user.emailAddresses[0]?.emailAddress || "",
    avatar: user.imageUrl,
    membership: "pro"
  }

  return (
    <DashboardClientLayout userData={userData}>
      {children}
    </DashboardClientLayout>
  )
}
