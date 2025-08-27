import { db } from "@/db"
import { reports } from "@/db/schema/reports"
import { reportMessages } from "@/db/schema/reportMessages"
import { reportCategories } from "@/db/schema/reportCategories"
import { reportLogs } from "@/db/schema/reportLogs"
import { eq, asc } from "drizzle-orm"
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

  const msgs = await db
    .select()
    .from(reportMessages)
    .where(eq(reportMessages.reportId, report.id))
    .orderBy(asc(reportMessages.createdAt))

  const thread = msgs.map(m => {
    try {
      const payload = JSON.parse(m.bodyEncrypted)
      const body = decryptField(report.orgId, payload).toString("utf8")
      return { ...m, body }
    } catch {
      return { ...m, body: "[unable to decrypt]" }
    }
  })

  const items = thread.map(m => ({
    id: String(m.id),
    sender: m.sender as "REPORTER" | "HANDLER",
    body: (m as unknown as { body: string }).body,
    createdAt: (m.createdAt as Date).toISOString()
  }))
  const CaseTabs = (await import("./case-tabs")).default
  const SlaPanel = (await import("./sla-panel")).default

  const logs = await db
    .select()
    .from(reportLogs)
    .where(eq(reportLogs.reportId, report.id))
    .orderBy(asc(reportLogs.createdAt))

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

          <CaseTabs reportId={String(report.id)} initialThread={items} initialLogs={logs} />
        </div>

        <div className="space-y-4">
          <InfoPanel report={report} orgName={orgName} />
          <SlaPanel reportId={String(report.id)} />
        </div>
      </div>
    </div>
  )
}
