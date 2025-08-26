"use client"

import { type Role } from "@/lib/authz"
import { useAuth, useOrganization } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

export function RequireRole({
  children,
  allowed,
  redirectTo = "/",
  mode = "block",
  fallback
}: {
  children: React.ReactNode
  allowed: Role[]
  redirectTo?: string
  mode?: "redirect" | "block"
  fallback?: React.ReactNode
}) {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { organization, isLoaded: orgLoaded } = useOrganization()
  const [dbRole, setDbRole] = useState<Role | null>(null)
  const [roleLoaded, setRoleLoaded] = useState(false)

  useEffect(() => {
    if (!isLoaded || !orgLoaded) return
    if (!isSignedIn || !organization) return
    let aborted = false
    ;(async () => {
      try {
        const res = await fetch("/api/auth/role", { cache: "no-store" })
        const data = await res.json()
        if (!aborted) {
          setDbRole(data.role ?? null)
          setRoleLoaded(true)
        }
      } catch (_e) {
        if (!aborted) {
          setDbRole(null)
          setRoleLoaded(true)
        }
      }
    })()
    return () => {
      aborted = true
    }
  }, [isLoaded, orgLoaded, isSignedIn, organization])

  const hasAccess = useMemo(() => {
    if (!isSignedIn) return false
    if (!organization) return false
    if (!roleLoaded) return false
    if (!dbRole) return false
    return allowed.includes(dbRole)
  }, [allowed, isSignedIn, organization, dbRole, roleLoaded])

  useEffect(() => {
    if (!isLoaded || !orgLoaded) return
    if (mode === "redirect" && !hasAccess) router.replace(redirectTo)
  }, [hasAccess, isLoaded, orgLoaded, redirectTo, router, mode])

  if (!isLoaded || !orgLoaded || !roleLoaded) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        Loading access…
      </div>
    )
  }
  if (!hasAccess) {
    if (mode === "redirect") return null
    return (
      <div className="rounded border p-6 text-sm">
        {fallback ?? (
          <div className="space-y-2">
            <div className="font-medium">You don't have access to this area.</div>
            <p className="text-muted-foreground">Switch to an organization where you have the required role or contact your administrator.</p>
            <a href="/org-setup" className="inline-flex rounded bg-primary px-3 py-2 text-primary-foreground">Switch organization</a>
          </div>
        )}
      </div>
    )
  }
  return <>{children}</>
}


