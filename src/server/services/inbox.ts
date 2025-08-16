import { db } from "@/db"
import { reports } from "@/db/schema/reports"
import { reportMessages } from "@/db/schema/reportMessages"
import { attachments } from "@/db/schema/attachments"
import { and, eq, asc } from "drizzle-orm"
import { decryptField, encryptField } from "@/lib/crypto/encryption"
import { hashCaseKey } from "@/lib/ids"
import type { EncryptedPayload } from "@/lib/crypto/types"

export async function findReportByReceipt(receiptCode: string) {
  const report = await db.query.reports.findFirst({ where: eq(reports.caseId, receiptCode) })
  return report
}

export async function verifyReceiptPassphrase(receiptCode: string, passphrase: string) {
  const report = await findReportByReceipt(receiptCode)
  if (!report) return null
  const hashed = hashCaseKey(passphrase)
  if (hashed !== report.caseKeyHash) return null
  return report
}

export async function getThreadForReporter(receiptCode: string, passphrase: string) {
  const report = await verifyReceiptPassphrase(receiptCode, passphrase)
  if (!report) return null

  const msgs = await db
    .select()
    .from(reportMessages)
    .where(eq(reportMessages.reportId, report.id))
    .orderBy(asc(reportMessages.createdAt))

  const result = [] as Array<{
    id: string
    sender: "REPORTER" | "HANDLER"
    body: string
    createdAt: Date
  }>

  for (const m of msgs) {
    try {
      const payload = JSON.parse(m.bodyEncrypted) as EncryptedPayload
      const body = decryptField(report.orgId, payload).toString("utf8")
      result.push({ id: m.id, sender: m.sender as any, body, createdAt: m.createdAt })
    } catch {
      result.push({ id: m.id, sender: m.sender as any, body: "[unable to decrypt]", createdAt: m.createdAt })
    }
  }

  return { report, messages: result }
}

export async function postReporterMessage(
  receiptCode: string,
  passphrase: string,
  body: string,
  attachmentInputs?: Array<{ storageKey: string; filename: string; size: number; contentHash: string }>
) {
  const report = await verifyReceiptPassphrase(receiptCode, passphrase)
  if (!report) return null

  const encrypted = encryptField(report.orgId, body)
  const inserted = await db
    .insert(reportMessages)
    .values({ reportId: report.id, sender: "REPORTER", bodyEncrypted: JSON.stringify(encrypted) })
    .returning()

  const message = inserted[0]
  if (attachmentInputs && attachmentInputs.length > 0) {
    await db.insert(attachments).values(
      attachmentInputs.map((a) => ({
        reportId: report.id,
        messageId: message.id,
        storageKey: a.storageKey,
        filename: a.filename,
        size: a.size,
        contentHash: a.contentHash,
        avStatus: "PENDING",
      }))
    )
  }

  return { report, messageId: message.id }
}


