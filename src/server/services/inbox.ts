import { db } from "@/db"
import { reports } from "@/db/schema/reports"
import { reportMessages } from "@/db/schema/reportMessages"
import { attachments } from "@/db/schema/attachments"
import { reportCategories } from "@/db/schema/reportCategories"
import { and, eq, asc } from "drizzle-orm"
import { decryptField, encryptField } from "@/lib/crypto/encryption"
import { hashCaseKey } from "@/lib/ids"
import type { EncryptedPayload } from "@/lib/crypto/types"
import { generatePresignedDownloadUrl } from "@/lib/storage/supabase"

export async function findReportByReceipt(receiptCode: string) {
  // Prefer matching by public Case ID (caseId)
  const byCaseId = await db.query.reports.findFirst({ where: eq(reports.caseId, receiptCode) })
  if (byCaseId) return byCaseId

  // Backward compatibility / user copy mistake: allow raw DB UUID too
  const looksLikeUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(receiptCode)
  if (looksLikeUuid) {
    const byId = await db.query.reports.findFirst({ where: eq(reports.id, receiptCode as any) })
    if (byId) return byId
  }

  return null
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

  // Fetch attachments for this report
  const attRows = await db
    .select()
    .from(attachments)
    .where(eq(attachments.reportId, report.id))

  const signedAttachments: Array<{
    id: string
    filename: string
    size: number
    storageKey: string
    downloadUrl: string
    messageId: string | null
  }> = []

  for (const a of attRows) {
    try {
      const url = await generatePresignedDownloadUrl(a.storageKey)
      signedAttachments.push({
        id: a.id,
        filename: a.filename,
        size: a.size,
        storageKey: a.storageKey,
        downloadUrl: url,
        messageId: a.messageId || null,
      })
    } catch {
      signedAttachments.push({
        id: a.id,
        filename: a.filename,
        size: a.size,
        storageKey: a.storageKey,
        downloadUrl: "",
        messageId: a.messageId || null,
      })
    }
  }

  const lastMessageAt = result.length > 0 ? result[result.length - 1].createdAt : report.createdAt
  const category = await db.query.reportCategories.findFirst({ where: eq(reportCategories.id, report.categoryId) })

  return {
    report: {
      id: report.id,
      caseId: report.caseId,
      reporterMode: report.reporterMode as any,
      categoryId: report.categoryId,
      categoryName: category?.name || "",
      createdAt: report.createdAt,
      lastUpdated: lastMessageAt,
    },
    messages: result,
    attachments: signedAttachments,
  }
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
      }))
    )
  }

  return { report, messageId: message.id }
}


