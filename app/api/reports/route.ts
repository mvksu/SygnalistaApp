import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { reports } from "@/db/schema/reports"
import { orgMembers, orgRole } from "@/db/schema/orgMembers"
import { users } from "@/db/schema/users"
import { reportMessages } from "@/db/schema/reportMessages"
import { attachments } from "@/db/schema/attachments"
import { eq, and } from "drizzle-orm"
import { reportIntakeSchema } from "@/lib/validation/report"
import { isAllowedMimeType, getFileSizeLimit } from "@/lib/validation/upload"
import { generateCaseId, generateCaseKey, hashCaseKey } from "@/lib/ids"
import { encryptField } from "@/lib/crypto/encryption"
import { auth } from "@clerk/nextjs/server"
import { reportingChannels, reportingChannelAutoAssignments } from "@/db/schema/reportingChannels"
import { reportAssignees } from "@/db/schema/reportAssignees"
import { organizations } from "@/db/schema/organizations"
import { writeAudit, getAuditFingerprint } from "@/src/server/services/audit"

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
    let channel: any = null
    if (channelSlug) {
      channel = await db.query.reportingChannels.findFirst({ where: eq(reportingChannels.slug, channelSlug) })
      if (channel) {
        orgId = channel.orgId
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
    const now = new Date()
    const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId!) })
    const receipt = generateCaseId()
    const passphrase = generateCaseKey()
    const passphraseHash = hashCaseKey(passphrase)

    const reporterMode = anonymous ? "ANON" : "IDENTIFIED"
    const contactPayload = contact ? JSON.stringify(contact) : ""
    const contactEncrypted = contact ? encryptField(orgId!, contactPayload) : null

    // Resolve default assignee (first ADMIN in org)
    const adminMember = await db.query.orgMembers.findFirst({ where: and(eq(orgMembers.orgId, orgId!), eq(orgMembers.role, "ADMIN" as any)) })
    const defaultAssigneeMemberId = adminMember ? adminMember.id : null

    // Insert report
    const [inserted] = await db
      .insert(reports)
      .values({
        orgId,
        categoryId,
        subject: (body as any)?.subject || null,
        status: "NEW",
        createdAt: now,
        ackDueAt: new Date(now.getTime() + (((org?.ackDays as number) ?? 7) * 24 * 60 * 60 * 1000)),
        feedbackDueAt: addMonths(now, ((org?.feedbackMonths as number) ?? 3)),
        reporterMode,
        reporterContactEncrypted: contactEncrypted ? JSON.stringify(contactEncrypted) : null,
        caseId: receipt,
        caseKeyHash: passphraseHash,
      })
      .returning()

    // Auto-assign: if report submitted via a channel
    if (channel) {
      // 1. First try to assign to auto-assigned members
      const autoAssignedMembers = await db
        .select({ orgMemberId: reportingChannelAutoAssignments.orgMemberId })
        .from(reportingChannelAutoAssignments)
        .where(eq(reportingChannelAutoAssignments.channelId, channel.id))

      if (autoAssignedMembers.length > 0) {
        // Assign to all auto-assigned members
        const assignmentValues = autoAssignedMembers.map(auto => ({
          reportId: inserted.id,
          orgMemberId: auto.orgMemberId,
          addedByOrgMemberId: auto.orgMemberId
        }))
        
        await db
          .insert(reportAssignees)
          .values(assignmentValues)
          .onConflictDoNothing()
      } else {
        // 2. Fallback to channel creator
        const creatorMemberId = channel.createdByOrgMemberId
        const assigneeMemberId = creatorMemberId || defaultAssigneeMemberId || undefined
        if (assigneeMemberId) {
          await db
            .insert(reportAssignees)
            .values({ reportId: inserted.id, orgMemberId: assigneeMemberId, addedByOrgMemberId: assigneeMemberId })
            .onConflictDoNothing()
        }
      }
    }

    // Ensure at least one assignee (fallback to first ADMIN) for any path
    const existingAssignee = await db.query.reportAssignees.findFirst({ where: eq(reportAssignees.reportId, inserted.id) })
    if (!existingAssignee && defaultAssigneeMemberId) {
      await db
        .insert(reportAssignees)
        .values({ reportId: inserted.id, orgMemberId: defaultAssigneeMemberId, addedByOrgMemberId: defaultAssigneeMemberId })
        .onConflictDoNothing()
    }

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

    // Audit: record report creation
    try {
      const { ipHash, uaHash } = await getAuditFingerprint(request)
      await writeAudit({
        orgId: orgId!,
        actorId: null,
        action: "REPORT_CREATED",
        targetType: "report",
        targetId: inserted.id,
        ipHash,
        uaHash,
      })
    } catch {}

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


