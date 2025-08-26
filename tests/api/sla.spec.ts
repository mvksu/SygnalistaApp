import { describe, it, expect, vi, beforeAll } from "vitest"
import { NextRequest } from "next/server"
import { GET as getSla } from "@/app/api/reports/[id]/sla/route"
import { db } from "@/db"
import { organizations } from "@/db/schema/organizations"
import { reports } from "@/db/schema/reports"
import { reportCategories } from "@/db/schema/reportCategories"

vi.mock("@/lib/authz", () => ({ assertRoleInOrg: vi.fn().mockResolvedValue({ userId: "u1", orgId: "o-sla", role: "ADMIN" }) }))

describe("/api/reports/[id]/sla", () => {
  let reportId = ""
  beforeAll(async () => {
    await db.insert(organizations).values({ id: "o-sla", name: "SLA Org", slug: "sla-org", clerkOrgId: "clerk-sla" }).onConflictDoNothing()
    await db.insert(reportCategories).values({ id: "cat-sla-1", orgId: "o-sla", name: "General" }).onConflictDoNothing()
    const [r] = await db.insert(reports).values({ orgId: "o-sla", categoryId: "cat-sla-1", subject: "", status: "OPEN", reporterMode: "ANON", caseId: "CASE-1", caseKeyHash: "hash" as any, createdAt: new Date(Date.now() - 2*24*60*60*1000) }).returning()
    reportId = r.id
  })

  it("returns SLA info for report", async () => {
    const req = new NextRequest(`http://localhost/api/reports/${reportId}/sla`, { method: "GET" }) as any
    const res = await getSla(req, { params: Promise.resolve({ id: reportId }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty("ackDueAt")
    expect(json).toHaveProperty("ackStatus")
  })
})


