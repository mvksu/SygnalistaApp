import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { reports } from "@/db/schema/reports"
import { reportAssignees } from "@/db/schema/reportAssignees"
import { eq, and } from "drizzle-orm"
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

/**
 * Server-side authorization guard for report access.
 * Enforces that user belongs to org and has ADMIN/HANDLER role, and is assigned to the report (or ADMIN can access all if desired).
 */
export async function assertCanAccessReport(params: { orgId: string; userId: string; role: Role; reportId: string }) {
  const { orgId, userId, role, reportId } = params
  // Check report belongs to org
  const rpt = await db.query.reports.findFirst({ where: and(eq(reports.id, reportId), eq(reports.orgId, orgId)) })
  if (!rpt) throw new Error("Report not found in this organization")
  // ADMIN can read all cases; HANDLER must be assigned
  if (role === "ADMIN") return true
  const assignment = await db.query.reportAssignees.findFirst({ where: and(eq(reportAssignees.reportId, reportId), eq(reportAssignees.orgMemberId, userId)) })
  if (!assignment) throw new Error("Not authorized for this case")
  return true
}

export async function assertRoleInOrg(required: Role[]): Promise<{ userId: string; orgId: string; role: Role }> {
  const { userId, orgId, orgRole } = await auth()
  const role = normalizeRole(orgRole)
  if (!userId) throw new Error("Unauthenticated")
  if (!orgId) throw new Error("Organization required")
  if (!role || !required.includes(role)) throw new Error("Forbidden")
  return { userId, orgId, role }
}


