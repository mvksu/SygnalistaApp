import { db } from "@/db"
import { auditLog } from "@/db/schema/audit"

export async function writeAudit(options: {
  orgId: string
  actorId?: string | null
  action: string
  targetType: string
  targetId: string
  ipHash?: string | null
  uaHash?: string | null
}) {
  await db.insert(auditLog).values({
    orgId: options.orgId,
    actorId: options.actorId || null,
    action: options.action,
    targetType: options.targetType,
    targetId: options.targetId,
    ipHash: options.ipHash || null,
    uaHash: options.uaHash || null,
  })
}

export async function getAuditFingerprint(req: Request) {
  const ipHeader = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || ""
  const ip = ipHeader.split(",")[0].trim()
  const ua = req.headers.get("user-agent") || ""
  async function sha256(input: string) {
    if (!input) return null
    const enc = new TextEncoder().encode(input)
    // @ts-ignore - crypto.subtle available in edge/runtime
    const buf = await crypto.subtle.digest("SHA-256", enc)
    return Buffer.from(buf).toString("hex")
  }
  const [ipHash, uaHash] = await Promise.all([sha256(ip), sha256(ua)])
  return { ipHash, uaHash }
}

// Resolve current actor's orgMemberId using Clerk context
export async function getCurrentActorOrgMemberId(): Promise<{ orgMemberId: string | null; orgId: string | null }> {
  const { auth } = await import("@clerk/nextjs/server")
  const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
  const { users } = await import("@/db/schema/users")
  const { orgMembers } = await import("@/db/schema/orgMembers")
  const { eq, and } = await import("drizzle-orm")

  const { userId: clerkUserId, orgId: clerkOrgId } = await auth()
  if (!clerkUserId || !clerkOrgId) return { orgMemberId: null, orgId: null }
  const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
  const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, clerkUserId) })
  if (!dbUser) return { orgMemberId: null, orgId }
  const member = await db.query.orgMembers.findFirst({ where: and(eq(orgMembers.userId, dbUser.id), eq(orgMembers.orgId, orgId)) })
  return { orgMemberId: member?.id || null, orgId }
}



