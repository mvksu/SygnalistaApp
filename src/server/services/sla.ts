import { db } from "@/db"
import { slaEvents } from "@/db/schema/sla"
import { reports } from "@/db/schema/reports"
import { and, eq, gte, isNull } from "drizzle-orm"

export async function computeAndMarkSla(orgId: string) {
  const now = new Date()
  // Ack due: 7 days after createdAt when not acknowledged
  const ackCandidates = await db
    .select({ id: reports.id, createdAt: reports.createdAt, acknowledgedAt: reports.acknowledgedAt })
    .from(reports)
    .where(and(eq(reports.orgId, orgId)))

  // For brevity, just insert PENDING events if due and not already sent
  const inserts = [] as any[]
  for (const r of ackCandidates) {
    const ackDue = new Date(r.createdAt)
    ackDue.setDate(ackDue.getDate() + 7)
    if (!r.acknowledgedAt && ackDue <= now) {
      inserts.push({ reportId: r.id, type: "ACK_DUE" as any, dueAt: ackDue, status: "PENDING" as any })
    }
  }
  // Feedback due: use stored feedbackDueAt
  const feedbackCandidates = await db
    .select({ id: reports.id, feedbackDueAt: reports.feedbackDueAt })
    .from(reports)
    .where(eq(reports.orgId, orgId))
  for (const r of feedbackCandidates) {
    if (r.feedbackDueAt && r.feedbackDueAt <= now) {
      inserts.push({ reportId: r.id, type: "FEEDBACK_DUE" as any, dueAt: r.feedbackDueAt, status: "PENDING" as any })
    }
  }
  if (inserts.length > 0) {
    await db.insert(slaEvents).values(inserts)
  }
  return { inserted: inserts.length }
}





