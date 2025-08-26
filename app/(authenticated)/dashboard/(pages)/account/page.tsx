import { RequireRole } from "@/components/auth/require-role"
import { ROLES } from "@/lib/authz"
import AccountTabs from "./tabs"

export default function AccountPage() {
  return (
    <div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-muted-foreground text-sm">
          Your account details and preferences.
        </p>
      </div>
      <div className="mt-6">
        <AccountTabs />
      </div>
    </div>
  )
}
