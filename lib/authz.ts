import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export const ROLES = ["ADMIN", "HANDLER", "AUDITOR"] as const
export type Role = (typeof ROLES)[number]

function normalizeRole(value: string | null | undefined): Role | null {
  if (!value) return null
  const upper = value.toUpperCase()
  return (ROLES as readonly string[]).includes(upper) ? (upper as Role) : null
}

export function hasRequiredRole(
  userRole: string | null | undefined,
  required: Role[]
): boolean {
  const normalized = normalizeRole(userRole)
  if (!normalized) return false
  return required.includes(normalized)
}

export async function requireOrgAndRole(options: {
  allowed: Role[]
  redirectTo?: string
}) {
  const { allowed, redirectTo = "/" } = options
  const { userId, orgId, orgRole } = await auth()

  if (!userId) redirect("/login")
  if (!orgId) redirect(redirectTo)
  if (!hasRequiredRole(orgRole, allowed)) redirect(redirectTo)

  return { userId, orgId, role: normalizeRole(orgRole) as Role }
}

export async function getCurrentOrgRole(): Promise<Role | null> {
  const { orgRole } = await auth()
  return normalizeRole(orgRole)
}


