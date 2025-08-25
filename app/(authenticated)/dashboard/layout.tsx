import { getCustomerByUserId } from "@/actions/customers"
import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import DashboardClientLayout from "./_components/layout-client"

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { userId, orgId } = await auth() 

  if (!userId) {
    redirect("/login")
  }

  const customer = await getCustomerByUserId(userId)

  // jeżeli użytkownik jest w organizacji, pobierz jej membership z bazy
  const orgMembership = orgId ? await getOrganizationSubscription(orgId) : null

  const isPro =
    customer?.membership === "pro" || orgMembership?.membership === "pro"

  if (!isPro) {
    redirect("/?redirect=dashboard#pricing")
  }


  const userData = {
    name:
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.username || "User",
    email: user.emailAddresses[0]?.emailAddress || "",
    avatar: user.imageUrl,
    membership: customer?.membership || "pro"
  }

  return (
    <DashboardClientLayout userData={userData}>
      {children}
    </DashboardClientLayout>
  )
}
