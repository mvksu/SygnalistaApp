import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { reports } from "@/db/schema/reports"
import { reportAssignees } from "@/db/schema/reportAssignees"
import { orgMembers } from "@/db/schema/orgMembers"
import { users } from "@/db/schema/users"
import { eq, and } from "drizzle-orm"
import { redirect } from "next/navigation"
import { getDbOrgIdForClerkOrg } from "@/src/server/orgs"

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

async function getDbActorContext() {
  const { userId: clerkUserId, orgId: clerkOrgId } = await auth()
  if (!clerkUserId) return { error: "Unauthenticated" as const }
  if (!clerkOrgId) return { error: "Organization required" as const }

  const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, clerkUserId) })
  if (!dbUser) return { error: "User not provisioned" as const }

  const dbOrgId = await getDbOrgIdForClerkOrg(clerkOrgId)
  const member = await db.query.orgMembers.findFirst({ where: and(eq(orgMembers.userId, dbUser.id), eq(orgMembers.orgId, dbOrgId)) })
  if (!member) return { error: "Forbidden" as const }

  return { dbUserId: dbUser.id, dbOrgId, role: member.role as Role, orgMemberId: member.id }
}

export async function requireOrgAndRole(options: { allowed: Role[]; redirectTo?: string }) {
  const { allowed, redirectTo = "/" } = options
  const ctx = await getDbActorContext()
  if ("error" in ctx) redirect(ctx.error === "Unauthenticated" ? "/login" : redirectTo)
  if (!allowed.includes(ctx.role)) redirect(redirectTo)
  return { userId: ctx.dbUserId, orgId: ctx.dbOrgId, role: ctx.role }
}

export async function getCurrentOrgRole(): Promise<Role | null> {
  const ctx = await getDbActorContext()
  if ("error" in ctx) return null
  return ctx.role
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
  // Map DB userId + orgId → orgMemberId for assignment check
  const member = await db.query.orgMembers.findFirst({ where: and(eq(orgMembers.userId, userId), eq(orgMembers.orgId, orgId)) })
  if (!member) throw new Error("Not authorized for this case")
  const assignment = await db.query.reportAssignees.findFirst({ where: and(eq(reportAssignees.reportId, reportId), eq(reportAssignees.orgMemberId, member.id)) })
  if (!assignment) throw new Error("Not authorized for this case")
  return true
}

export async function assertRoleInOrg(required: Role[]): Promise<{ userId: string; orgId: string; role: Role }> {
  const ctx = await getDbActorContext()
  if ("error" in ctx) throw new Error(ctx.error)
  if (!required.includes(ctx.role)) throw new Error("Forbidden")
  return { userId: ctx.dbUserId, orgId: ctx.dbOrgId, role: ctx.role }
}


