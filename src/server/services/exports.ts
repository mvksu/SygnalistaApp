import { db } from "@/db"
import { exportsTable } from "@/db/schema/exports"
import { organizations } from "@/db/schema/organizations"
import { listRegister } from "@/src/server/services/register"
import { createHash } from "crypto"

export async function exportRegisterCSV(orgId: string, period: { from: Date; to: Date }) {
  const rows = await listRegister(orgId, { from: period.from, to: period.to, limit: 10_000 })
  const header = ["case_id", "category", "status", "created", "acknowledged", "feedback_due"]
  const csv = [header.join(",")]
  for (const r of rows) {
    csv.push(
      [
        (r as any).caseId || (r as any).receiptCode,
        r.categoryName,
        r.status,
        r.createdAt ? new Date(r.createdAt).toISOString() : "",
        r.acknowledgedAt ? new Date(r.acknowledgedAt).toISOString() : "",
        r.feedbackDueAt ? new Date(r.feedbackDueAt).toISOString() : "",
      ].join(",")
    )
  }
  const content = csv.join("\n")
  const checksum = createHash("sha256").update(content).digest("hex")
  // For now, we return the CSV directly and record a placeholder storage key
  const periodLabel = `${period.from.toISOString().slice(0, 7)}`
  await db.insert(exportsTable).values({
    orgId,
    period: periodLabel,
    type: "REGISTER" as any,
    checksum,
    storageKey: `exports/register-${periodLabel}.csv`,
  })
  return { content, checksum, filename: `register-${periodLabel}.csv` }
}

/**
 * Create a monthly snapshot entry for the organization's register.
 * Uses the first day of the current month to the last day as the period.
 */
export async function createMonthlyRegisterSnapshot(orgId: string) {
  const now = new Date()
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))
  const { checksum } = await exportRegisterCSV(orgId, { from, to })
  return { orgId, from, to, checksum }
}

/**
 * Iterate all organizations and create monthly snapshot entries.
 */
export async function createMonthlySnapshotsForAllOrgs() {
  const allOrgs = await db.select({ id: organizations.id }).from(organizations)
  const results: Array<{ orgId: string; checksum: string }> = []
  for (const org of allOrgs) {
    const res = await createMonthlyRegisterSnapshot(org.id)
    results.push({ orgId: res.orgId, checksum: res.checksum })
  }
  return { count: results.length, results }
}





