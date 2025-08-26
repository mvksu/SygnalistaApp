import { db } from "@/db"
import { slaEvents } from "@/db/schema/sla"
import { reports } from "@/db/schema/reports"
import { organizations } from "@/db/schema/organizations"
import { and, eq } from "drizzle-orm"
import { decryptField } from "@/lib/crypto/encryption"
import type { EncryptedPayload } from "@/lib/crypto/types"
import { sendAcknowledgeEmail, sendFeedbackEmail } from "@/src/server/notify/mailer"

export async function computeAndMarkSla(orgId: string) {
  const now = new Date()
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) })
  const ackDays = (org?.ackDays as number) ?? 7
  // Ack due: 7 days after createdAt when not acknowledged
  const ackCandidates = await db
    .select({ id: reports.id, createdAt: reports.createdAt, acknowledgedAt: reports.acknowledgedAt, reporterContactEncrypted: reports.reporterContactEncrypted, caseId: reports.caseId })
    .from(reports)
    .where(and(eq(reports.orgId, orgId)))

  const inserts: Array<{ reportId: string; type: any; dueAt: Date; status: any }> = []
  for (const r of ackCandidates) {
    const ackDue = new Date(r.createdAt)
    ackDue.setDate(ackDue.getDate() + ackDays)
    if (!r.acknowledgedAt && ackDue <= now) {
      inserts.push({ reportId: r.id, type: "ACK_DUE" as any, dueAt: ackDue, status: "PENDING" as any })
      // Attempt to send acknowledgement if contact exists
      if (r.reporterContactEncrypted) {
        try {
          const payload = JSON.parse(r.reporterContactEncrypted) as EncryptedPayload
          const buf = decryptField(orgId, payload)
          const contact = JSON.parse(buf.toString("utf8")) as { email?: string }
          if (contact.email) {
            await sendAcknowledgeEmail({ to: contact.email, orgName: org?.name || "Organization", caseId: r.caseId, createdAt: r.createdAt as Date })
          }
        } catch {
          // ignore decrypt/send errors to keep cron robust
        }
      }
    }
  }
  // Feedback due: use stored feedbackDueAt
  const feedbackCandidates = await db
    .select({ id: reports.id, feedbackDueAt: reports.feedbackDueAt, reporterContactEncrypted: reports.reporterContactEncrypted, caseId: reports.caseId })
    .from(reports)
    .where(eq(reports.orgId, orgId))
  for (const r of feedbackCandidates) {
    if (r.feedbackDueAt && r.feedbackDueAt <= now) {
      inserts.push({ reportId: r.id, type: "FEEDBACK_DUE" as any, dueAt: r.feedbackDueAt, status: "PENDING" as any })
      if (r.reporterContactEncrypted) {
        try {
          const payload = JSON.parse(r.reporterContactEncrypted) as EncryptedPayload
          const buf = decryptField(orgId, payload)
          const contact = JSON.parse(buf.toString("utf8")) as { email?: string }
          if (contact.email) {
            await sendFeedbackEmail({ to: contact.email, orgName: org?.name || "Organization", caseId: r.caseId, feedbackAt: new Date() })
          }
        } catch {}
      }
    }
  }
  if (inserts.length > 0) {
    await db.insert(slaEvents).values(inserts)
  }
  return { inserted: inserts.length }
}





