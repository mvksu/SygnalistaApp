"use client"

import { type Role } from "@/lib/authz"
import { useAuth, useOrganization } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"

export function RequireRole({
  children,
  allowed,
  redirectTo = "/"
}: {
  children: React.ReactNode
  allowed: Role[]
  redirectTo?: string
}) {
  const router = useRouter()
  const { isLoaded, isSignedIn, orgRole } = useAuth()
  const { organization, isLoaded: orgLoaded } = useOrganization()

  const hasAccess = useMemo(() => {
    if (!isSignedIn) return false
    if (!organization) return false
    if (!orgRole) return false
    const normalized = orgRole.toUpperCase() as Role
    return allowed.includes(normalized)
  }, [allowed, isSignedIn, organization, orgRole])

  useEffect(() => {
    if (!isLoaded || !orgLoaded) return
    if (!hasAccess) router.replace(redirectTo)
  }, [hasAccess, isLoaded, orgLoaded, redirectTo, router])

  if (!isLoaded || !orgLoaded) return null
  if (!hasAccess) return null
  return <>{children}</>
}


