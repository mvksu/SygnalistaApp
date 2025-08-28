import { db } from "@/db"
import { reports, SelectReport } from "@/db/schema/reports"
import { reportMessages } from "@/db/schema/reportMessages"
import { and, eq } from "drizzle-orm"
import { encryptField } from "@/lib/crypto/encryption"
import { writeAudit } from "@/src/server/services/audit"
import { sendAcknowledgeEmail, sendFeedbackEmail } from "@/src/server/notify/mailer"
import { organizations } from "@/db/schema/organizations"
import { logReport } from "./reportLogs"
import { reportAssignees } from "@/db/schema/reportAssignees"
import { routingRules } from "@/db/schema/routingRules"
import { orgMembers } from "@/db/schema/orgMembers"
import { reportingChannels } from "@/db/schema/reportingChannels"


export async function acknowledgeReport(options: { orgId: string; reportId: string; actorId?: string | null }) {
  const now = new Date()
  const [updated] = await db
    .update(reports)
    .set({ acknowledgedAt: now, status: "OPEN" as any })
    .where(eq(reports.id, options.reportId))
    .returning()

  await writeAudit({ orgId: options.orgId, actorId: options.actorId || null, action: "REPORT_ACKNOWLEDGED", targetType: "report", targetId: options.reportId })

  // Optional email: only if reporter provided contact email (not modeled yet in this snippet)
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, options.orgId) })
  const contactEmail = null as string | null // integrate when reporter contact/email is stored
  if (org && contactEmail) {
    await sendAcknowledgeEmail({ to: contactEmail, orgName: org.name, caseId: updated.caseId, createdAt: updated.createdAt })
  }
  return updated
}

export async function giveFeedback(options: { orgId: string; reportId: string; actorId?: string | null }) {
  const [updated] = await db
    .update(reports)
    .set({ status: "OPEN" as any })
    .where(eq(reports.id, options.reportId))
    .returning()

  await writeAudit({ orgId: options.orgId, actorId: options.actorId || null, action: "REPORT_FEEDBACK_GIVEN", targetType: "report", targetId: options.reportId })
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, options.orgId) })
  const contactEmail = null as string | null
  if (org && contactEmail) {
    await sendFeedbackEmail({ to: contactEmail, orgName: org.name, caseId: updated.caseId, feedbackAt: new Date() })
  }
  return updated
}

export async function addHandlerMessage(options: { orgId: string; reportId: string; body: string; actorId?: string | null }) {
  const payload = encryptField(options.orgId, options.body)
  const [msg] = await db
    .insert(reportMessages)
    .values({ reportId: options.reportId, sender: "HANDLER" as any, bodyEncrypted: JSON.stringify(payload) })
    .returning()
  await writeAudit({ orgId: options.orgId, actorId: options.actorId || null, action: "REPORT_MESSAGE_ADDED", targetType: "report", targetId: options.reportId })
  return msg
}

export async function updateReportStatus(options: { orgId: string; reportId: string; status: string; actorId?: string | null }) {
  const [updated] = await db
    .update(reports)
    .set({ status: options.status as SelectReport["status"] })
    .where(eq(reports.id, options.reportId))
    .returning()
  
  return updated
} 

// assign
export async function assignReport({ reportId, orgMemberId, actorId }: { reportId: string; orgMemberId: string; actorId?: string }) {
  await db.insert(reportAssignees).values({ reportId, orgMemberId, addedByOrgMemberId: actorId }).onConflictDoNothing()
  await logReport(reportId, "assignment_added", `Assigned org_member_id=${orgMemberId}`, actorId)
}

// unassign
export async function unassignReport({ reportId, orgMemberId, actorId }: { reportId: string; orgMemberId: string; actorId?: string }) {
  await db.delete(reportAssignees)
    .where(and(eq(reportAssignees.reportId, reportId), eq(reportAssignees.orgMemberId, orgMemberId)))
  await logReport(reportId, "assignment_removed", `Unassigned org_member_id=${orgMemberId}`, actorId)
}

export async function assignDefaultAssignee({
  reportId,
  orgId,
  categoryId,
  channelId
}: {
  reportId: string
  orgId: string
  categoryId?: string | null
  channelId?: string | null
}) {
  const rules = await db
    .select()
    .from(routingRules)
    .where(eq(routingRules.orgId, orgId))

  rules.sort(
    (a, b) =>
      (b.categoryId ? 1 : 0) + (b.channelId ? 1 : 0) - ((a.categoryId ? 1 : 0) + (a.channelId ? 1 : 0))
  )

  const matched = rules.find(
    r =>
      (!r.categoryId || r.categoryId === categoryId) &&
      (!r.channelId || r.channelId === channelId)
  )

  let orgMemberId = matched?.orgMemberId || null
  if (!orgMemberId && channelId) {
    const channel = await db.query.reportingChannels.findFirst({ where: eq(reportingChannels.id, channelId) })
    orgMemberId = channel?.createdByOrgMemberId || null
  }
  if (!orgMemberId) {
    const adminMember = await db.query.orgMembers.findFirst({
      where: and(eq(orgMembers.orgId, orgId), eq(orgMembers.role, "ADMIN" as any))
    })
    orgMemberId = adminMember?.id || null
  }

  if (orgMemberId) {
    await assignReport({ reportId, orgMemberId })
  }
}




