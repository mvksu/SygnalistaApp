import { RequireRole } from "@/components/auth/require-role"
import { ROLES } from "@/lib/authz"

export default function AccountPage() {
  return (
    <RequireRole allowed={["ADMIN", "HANDLER", "AUDITOR"] as (typeof ROLES)[number][]}>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-muted-foreground text-sm">
          Your account details and preferences.
        </p>
      </div>
    </RequireRole>
  )
}


