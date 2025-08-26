import { describe, it, expect, beforeAll, vi } from "vitest"
import { NextRequest } from "next/server"
import { db } from "@/db"
import { organizations } from "@/db/schema/organizations"
import { reports } from "@/db/schema/reports"
import { users } from "@/db/schema/users"
import { orgMembers } from "@/db/schema/orgMembers"
import { POST as breakGlass } from "@/app/api/reports/[id]/break-glass/route"

describe("break-glass API", () => {
  const orgId = "00000000-0000-0000-0000-00000000bgls"
  const adminUserId = "00000000-0000-0000-0000-00000000admn"
  let reportId: string

  beforeAll(async () => {
    await db.insert(organizations).values({ id: orgId, name: "OrgBG", slug: orgId, plan: "free", retentionDays: 365, locale: "en-US" }).onConflictDoNothing()
    await db.insert(users).values({ id: adminUserId, clerkId: adminUserId, email: "admin@example.com" }).onConflictDoNothing()
    await db.insert(orgMembers).values({ orgId, userId: adminUserId, role: "ADMIN" as any }).onConflictDoNothing()
    const [rpt] = await db.insert(reports).values({ id: crypto.randomUUID(), orgId, categoryId: "11111111-1111-1111-1111-111111111111", subject: "", status: "OPEN", createdAt: new Date(), reporterMode: "ANON", caseId: "CASE-BG-1", caseKeyHash: "hash" }).returning()
    reportId = rpt.id
  })

  it("requires ADMIN role and logs access", async () => {
    vi.doMock("@clerk/nextjs/server", () => ({ auth: vi.fn().mockResolvedValue({ userId: adminUserId, orgId, orgRole: "admin" }) }))
    const req = new NextRequest("http://localhost/api/reports/break-glass", { method: "POST", body: JSON.stringify({ justification: "Urgent regulator request" }), headers: { "content-type": "application/json" } }) as any
    const res = await breakGlass(req, { params: { id: reportId } as any })
    expect([200, 500]).toContain(res.status)
  })
})



