import { db } from "@/db"
import { reports } from "@/db/schema/reports"
import { reportMessages } from "@/db/schema/reportMessages"
import { reportCategories } from "@/db/schema/reportCategories"
import { eq, asc } from "drizzle-orm"
import { decryptField } from "@/lib/crypto/encryption"
import { auth } from "@clerk/nextjs/server"

export default async function CaseViewPage({ params }: { params: Promise<{ id: string }> }) {
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

  const thread = msgs.map((m) => {
    try {
      const payload = JSON.parse(m.bodyEncrypted)
      const body = decryptField(report.orgId, payload).toString("utf8")
      return { ...m, body }
    } catch {
      return { ...m, body: "[unable to decrypt]" }
    }
  })

  const items = thread.map((m) => ({ id: String(m.id), sender: m.sender as "REPORTER" | "HANDLER", body: (m as unknown as { body: string }).body, createdAt: (m.createdAt as Date).toISOString() }))
  const CaseTabs = (await import("./case-tabs")).default

  const [cat] = await db.select({ name: reportCategories.name }).from(reportCategories).where(eq(reportCategories.id, report.categoryId))
  const senderLabel = report.reporterMode === "ANON" ? "Anonymous" : "Identified"

  const info: Array<{ label: string; value: string }> = [
    { label: "Status", value: report.status },
    { label: "Submitted", value: (report.createdAt as Date).toLocaleString() },
    { label: "Last update", value: (report.acknowledgedAt as Date | null)?.toLocaleString?.() || "—" }
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="rounded border p-4">
          <div className="mb-2 text-base font-semibold">Case detail</div>
          <div className="grid gap-3 text-sm">
            <div>
              <div className="text-muted-foreground text-xs uppercase">Sender</div>
              <div>{senderLabel}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs uppercase">Category</div>
              <div>{cat?.name || "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs uppercase">Case ID</div>
              <div className="font-mono">{report.caseId}</div>
            </div>
          </div>
        </div>

        <CaseTabs reportId={String(report.id)} initialThread={items} />
      </div>

      <div className="space-y-4">
        <div className="rounded border p-4">
          <div className="mb-2 text-base font-semibold">Information</div>
          <div className="space-y-2 text-sm">
            {info.map(i => (
              <div key={i.label} className="flex items-center justify-between">
                <div className="text-muted-foreground">{i.label}</div>
                <div>{i.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


