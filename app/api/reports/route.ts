import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { reports } from "@/db/schema/reports"
import { reportMessages } from "@/db/schema/reportMessages"
import { attachments } from "@/db/schema/attachments"
import { eq } from "drizzle-orm"
import { reportIntakeSchema } from "@/lib/validation/report"
import { isAllowedMimeType, getFileSizeLimit } from "@/lib/validation/upload"
import { generateCaseId, generateCaseKey, hashCaseKey } from "@/lib/ids"
import { encryptField } from "@/lib/crypto/encryption"
import { auth } from "@clerk/nextjs/server"
import { reportingChannels } from "@/db/schema/reportingChannels"
import { organizations } from "@/db/schema/organizations"
import { assignDefaultAssignee } from "@/src/server/services/reports"

// Compute feedback due (3 months) and initial SLA windows server-side
function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export async function POST(request: NextRequest) {
  try {
    // Determine organization context
    // 1) Prefer explicit channel slug provided by client (header or query)
    const url = new URL(request.url)
    const channelSlug = request.headers.get("x-channel-slug") || url.searchParams.get("channel") || undefined

    let orgId: string | null = null
    let channelId: string | null = null
    if (channelSlug) {
      const channel = await db.query.reportingChannels.findFirst({ where: eq(reportingChannels.slug, channelSlug) })
      if (channel) {
        orgId = channel.orgId
        channelId = channel.id
      } else {
        return NextResponse.json({ error: "Invalid channel" }, { status: 400 })
      }
    } else {
      // 2) Fallback to Clerk org context (authenticated dashboard submission)
      const { orgId: clerkOrgId } = await auth()
      if (!clerkOrgId) {
        return NextResponse.json({ error: "Organization context required" }, { status: 400 })
      }
      const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
      orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
    }

    const body = await request.json()
    const parsed = reportIntakeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 })
    }

    const { categoryId, body: messageBody, anonymous, contact,  attachments: uploaded } = parsed.data

    // Rate limiting should be applied by a middleware in production; optionally add lightweight guard here
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || undefined


    const now = new Date()
    const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId!) })
    const receipt = generateCaseId()
    const passphrase = generateCaseKey()
    const passphraseHash = hashCaseKey(passphrase)

    const reporterMode = anonymous ? "ANON" : "IDENTIFIED"
    const contactPayload = contact ? JSON.stringify(contact) : ""
    const contactEncrypted = contact ? encryptField(orgId!, contactPayload) : null

    // Insert report
    const [inserted] = await db
      .insert(reports)
      .values({
        orgId,
        categoryId,
        subject: (body as any)?.subject || null,
        status: "OPEN",
        createdAt: now,
        ackDueAt: new Date(now.getTime() + (((org?.ackDays as number) ?? 7) * 24 * 60 * 60 * 1000)),
        feedbackDueAt: addMonths(now, ((org?.feedbackMonths as number) ?? 3)),
        reporterMode,
        reporterContactEncrypted: contactEncrypted ? JSON.stringify(contactEncrypted) : null,
        caseId: receipt,
        caseKeyHash: passphraseHash,
      })
      .returning()

    // First message saved encrypted under org key
    const firstMessageEncrypted = encryptField(orgId!, messageBody)
    const [firstMessage] = await db
      .insert(reportMessages)
      .values({
        reportId: inserted.id,
        sender: "REPORTER",
        bodyEncrypted: JSON.stringify(firstMessageEncrypted),
        createdAt: now,
      })
      .returning()

    // If attachments were provided, validate and persist rows
    if (uploaded && uploaded.length > 0) {
      const rowsToInsert: Array<{
        reportId: string
        messageId: string
        storageKey: string
        filename: string
        size: number
        contentHash: string
      }> = []

      for (const file of uploaded) {
        // Require storageKey and checksum for DB record integrity
        if (!file.storageKey || !file.checksum) {
          return NextResponse.json(
            { error: "Attachment missing storageKey or checksum" },
            { status: 400 }
          )
        }

        // Enforce tenancy and path sanity: must live under this org
        const expectedOrgPrefix = `orgs/${orgId}/`
        if (!file.storageKey.startsWith(expectedOrgPrefix)) {
          return NextResponse.json(
            { error: "Attachment does not belong to this organization" },
            { status: 400 }
          )
        }

        // Validate MIME and size against server policy
        if (!isAllowedMimeType(file.contentType)) {
          return NextResponse.json(
            { error: `File type ${file.contentType} is not allowed` },
            { status: 400 }
          )
        }
        const limit = getFileSizeLimit(file.contentType)
        if (file.size > limit) {
          return NextResponse.json(
            { error: `File size ${file.size} exceeds limit ${limit} for ${file.contentType}` },
            { status: 400 }
          )
        }

        rowsToInsert.push({
          reportId: inserted.id,
          messageId: firstMessage.id,
          storageKey: file.storageKey,
          filename: file.filename,
          size: file.size,
          contentHash: file.checksum,
          // avStatus defaults to PENDING
        })
      }

      if (rowsToInsert.length > 0) {
        await db.insert(attachments).values(rowsToInsert as any)
      }
    }

    await assignDefaultAssignee({
      reportId: inserted.id,
      orgId: orgId!,
      categoryId,
      channelId
    })

    return NextResponse.json({
      id: inserted.id,
      caseId: receipt,
      caseKey: passphrase, // returned ONCE; client must show securely and not store
      feedbackDueAt: inserted.feedbackDueAt,
      // include message id for client threading if needed
      messageId: firstMessage.id,
    })
  } catch (err: any) {
    console.error("Create report error", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


