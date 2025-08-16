import { getCustomerByUserId } from "@/actions/customers"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import DashboardClientLayout from "./_components/layout-client"

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()

  if (!user) {
    redirect("/login")
  }

  const customer = await getCustomerByUserId(user.id)

  const disableProGate = process.env.NEXT_PUBLIC_DISABLE_PRO_GATE === "true"

  // Gate dashboard access for pro members only
  // Store a message to show why they were redirected
  if (!disableProGate && (!customer || customer.membership !== "pro")) {
    // Using searchParams to pass a message that can be read by client components
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
