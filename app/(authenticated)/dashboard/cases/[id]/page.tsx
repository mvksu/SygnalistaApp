import { db } from "@/db"
import { reports } from "@/db/schema/reports"
import { reportMessages } from "@/db/schema/reportMessages"
import { attachments } from "@/db/schema/attachments"
import { reportCategories } from "@/db/schema/reportCategories"
import { reportLogs } from "@/db/schema/reportLogs"
import { reportViews } from "@/db/schema/reportViews"
import { eq, asc, desc } from "drizzle-orm"
import { reportAssignees } from "@/db/schema/reportAssignees"
import { orgMembers } from "@/db/schema/orgMembers"
import { users } from "@/db/schema/users"
import { decryptField } from "@/lib/crypto/encryption"
import { auth } from "@clerk/nextjs/server"
import { organizations } from "@/db/schema/organizations"
import InfoPanel from "./info-panel"
import { OptionsPanel } from "./options-panel"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"

export default async function CaseViewPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return null
  const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
  const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
  const { id } = await params

  const [report] = await db.select().from(reports).where(eq(reports.id, id))
  if (!report) return null

  // If report is NEW and the current viewer is assigned, mark it OPEN
  if (report.status === "NEW") {
    const { userId: clerkUserId, orgId: clerkOrgId } = await auth()
    if (clerkUserId && clerkOrgId) {
      const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
      const dbOrgId = await getDbOrgIdForClerkOrg(clerkOrgId)
      const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, clerkUserId) })
      if (dbUser) {
        const member = await db.query.orgMembers.findFirst({ where: eq(orgMembers.userId, dbUser.id) })
        if (member) {
          const isAssigned = await db.query.reportAssignees.findFirst({ where: eq(reportAssignees.orgMemberId, member.id) })
          if (isAssigned) {
            await db.update(reports).set({ status: "OPEN" as any }).where(eq(reports.id, report.id))
            await db.insert(reportLogs).values({
              reportId: report.id,
              orgMemberId: member.id,
              type: "status_changed",
              message: "Status set to OPEN"
            })
          }
        }
      }
    }
  }

  const msgs = await db
    .select()
    .from(reportMessages)
    .where(eq(reportMessages.reportId, report.id))
    .orderBy(asc(reportMessages.createdAt))
  const byMessageId: Record<string, { id: string; filename: string; storageKey: string; size: number }[]> = {}
  const allAtt = await db
    .select({ id: attachments.id, messageId: attachments.messageId, filename: attachments.filename, storageKey: attachments.storageKey, size: attachments.size })
    .from(attachments)
    .where(eq(attachments.reportId, report.id))
  for (const a of allAtt) {
    const key = String(a.messageId || "")
    if (!byMessageId[key]) byMessageId[key] = []
    byMessageId[key].push({ id: a.id, filename: a.filename, storageKey: a.storageKey, size: a.size })
  }

  const thread = msgs.map(m => {
    try {
      const payload = JSON.parse(m.bodyEncrypted)
      const body = decryptField(report.orgId, payload).toString("utf8")
      return { ...m, body }
    } catch {
      return { ...m, body: "[unable to decrypt]" }
    }
  })

  // Resolve handler avatar for current user
  const clerk = await auth()
  const current = clerk ? await (await import("@clerk/nextjs/server")).currentUser().catch(() => null) : null
  const handlerAvatar = current?.imageUrl || ""

  const items = thread.map(m => ({
    id: String(m.id),
    sender: m.sender as "REPORTER" | "HANDLER",
    body: (m as unknown as { body: string }).body,
    createdAt: (m.createdAt as Date).toISOString(),
    avatarUrl: m.sender === "HANDLER" ? handlerAvatar : "",
    attachments: byMessageId[String(m.id)] || [],
    audioUrl: (() => {
      const atts = byMessageId[String(m.id)] || []
      // heuristic: if any attachment is .webm or content looks like audio (we lack mime here), expose download url as audio
      const a = atts.find(a => /\.(webm|ogg|mp3|wav|m4a)$/i.test(a.filename))
      return a ? `/api/files/download?key=${encodeURIComponent(a.storageKey)}` : undefined
    })()
  }))
  const CaseTabs = (await import("./case-tabs")).default
  const InternalNotes = (await import("./internal-notes")).default
  const SlaPanel = (await import("./sla-panel")).default
  const AccessPanel = (await import("./access-panel")).default

  const logs = await db
    .select({
      id: reportLogs.id,
      reportId: reportLogs.reportId,
      orgMemberId: reportLogs.orgMemberId,
      type: reportLogs.type,
      message: reportLogs.message,
      createdAt: reportLogs.createdAt,
      userName: users.name
    })
    .from(reportLogs)
    .leftJoin(orgMembers, eq(orgMembers.id, reportLogs.orgMemberId))
    .leftJoin(users, eq(users.id, orgMembers.userId))
    .where(eq(reportLogs.reportId, report.id))
    .orderBy(asc(reportLogs.createdAt))

  const internalNotes = logs.filter(l => l.type === "internal_comment")
  const activityLogs = logs.filter(l => l.type !== "internal_comment")

  const [cat] = await db
    .select({ name: reportCategories.name })
    .from(reportCategories)
    .where(eq(reportCategories.id, report.categoryId))
  const senderLabel =
    report.reporterMode === "ANON" ? "Anonymous" : "Identified"
  const orgName = (
    await db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, report.orgId))
  )[0].name

  const [lastView] = await db
    .select({ viewedAt: reportViews.viewedAt })
    .from(reportViews)
    .where(eq(reportViews.reportId, report.id))
    .orderBy(desc(reportViews.viewedAt))
    .limit(1)
  const lastReporterView = lastView?.viewedAt ?? null

  // Decrypt reporter contact if provided
  let reporterContact: { email?: string; phone?: string } | null = null
  try {
    if (report.reporterContactEncrypted) {
      const enc = JSON.parse(report.reporterContactEncrypted)
      const decrypted = decryptField(report.orgId, enc).toString("utf8")
      const obj = JSON.parse(decrypted)
      reporterContact = { email: obj?.email, phone: obj?.phone }
    }
  } catch {}


  return (
    <div>
      <OptionsPanel />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base">Case detail</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 p-4 pt-0 text-sm">
              <div>
                <div className="text-xs uppercase text-muted-foreground">Sender</div>
                <div>{senderLabel}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground">Category</div>
                <div>{cat?.name || "—"}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground">Case ID</div>
                <div className="font-mono">{report.caseId}</div>
              </div>
            </CardContent>
          </Card>

          <CaseTabs reportId={String(report.id)} initialThread={items} initialLogs={activityLogs} />
        </div>

        <div className="space-y-4">

          <Card>  
            <CardHeader className="p-4">
              <CardTitle className="text-base">Information</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <InfoPanel
                report={report}
                orgName={orgName}
                lastViewedByReporter={lastReporterView}
                reporterContact={reporterContact || undefined}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base">SLA</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <SlaPanel reportId={String(report.id)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base">Who has access</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <AccessPanel reportId={String(report.id)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base">Internal comments</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <InternalNotes reportId={String(report.id)} initialNotes={internalNotes as any} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
