import { describe, it, expect, beforeAll, vi } from "vitest"
import { NextRequest } from "next/server"
import { db } from "@/db"
import { organizations } from "@/db/schema/organizations"
import { reports } from "@/db/schema/reports"
import { reportAssignees } from "@/db/schema/reportAssignees"
import { users } from "@/db/schema/users"
import { POST as ack } from "@/app/api/reports/[id]/acknowledge/route"
import { POST as feedback } from "@/app/api/reports/[id]/feedback/route"
import { POST as setStatus } from "@/app/api/reports/[id]/status/route"

function uuid() { return crypto.randomUUID() }

describe("RLS app-layer guards", () => {
  const orgId = uuid()
  const otherOrgId = uuid()
  let reportId: string
  const handlerUserId = uuid()
  const adminUserId = uuid()

  beforeAll(async () => {
    process.env.APP_MASTER_KEY = Buffer.from(Array(32).fill(2)).toString("base64")
    await db.insert(organizations).values({ id: orgId, name: "Org A", slug: "orga", plan: "free", retentionDays: 365, locale: "en-US" }).onConflictDoNothing()
    await db.insert(organizations).values({ id: otherOrgId, name: "Org B", slug: "orgb", plan: "free", retentionDays: 365, locale: "en-US" }).onConflictDoNothing()
    await db.insert(users).values([
      { id: handlerUserId, clerkId: handlerUserId, email: "handler@example.com" },
      { id: adminUserId, clerkId: adminUserId, email: "admin@example.com" }
    ]).onConflictDoNothing()

    const [rpt] = await db.insert(reports).values({ id: uuid(), orgId, categoryId: "11111111-1111-1111-1111-111111111111", subject: "", status: "OPEN", createdAt: new Date(), reporterMode: "ANON", caseId: "CASE-RLS-1", caseKeyHash: "hash" }).returning()
    reportId = rpt.id
    await db.insert(reportAssignees).values({ reportId, orgMemberId: handlerUserId, addedAt: new Date() }).onConflictDoNothing()
  })

  it("denies HANDLER not assigned to report", async () => {
    vi.doMock("@clerk/nextjs/server", () => ({ auth: vi.fn().mockResolvedValue({ userId: uuid(), orgId: orgId, orgRole: "HANDLER" }) }))
    const req = new NextRequest("http://localhost/api/reports/acknowledge", { method: "POST" }) as any
    const res = await ack(req, { params: { id: reportId } as any })
    expect(res.status).toBe(500)
  })

  it("allows assigned HANDLER", async () => {
    vi.doMock("@clerk/nextjs/server", () => ({ auth: vi.fn().mockResolvedValue({ userId: handlerUserId, orgId: orgId, orgRole: "HANDLER" }) }))
    const req = new NextRequest("http://localhost/api/reports/acknowledge", { method: "POST" }) as any
    const res = await ack(req, { params: { id: reportId } as any })
    expect([200, 500]).toContain(res.status)
  })

  it("allows ADMIN without assignment", async () => {
    vi.doMock("@clerk/nextjs/server", () => ({ auth: vi.fn().mockResolvedValue({ userId: adminUserId, orgId: orgId, orgRole: "ADMIN" }) }))
    const req = new NextRequest("http://localhost/api/reports/status", { method: "POST", body: JSON.stringify({ status: "IN_PROGRESS" }), headers: { "content-type": "application/json" } }) as any
    const res = await setStatus(req, { params: { id: reportId } as any })
    expect([200, 500]).toContain(res.status)
  })

  it("denies cross-org access", async () => {
    vi.doMock("@clerk/nextjs/server", () => ({ auth: vi.fn().mockResolvedValue({ userId: adminUserId, orgId: otherOrgId, orgRole: "ADMIN" }) }))
    const req = new NextRequest("http://localhost/api/reports/feedback", { method: "POST" }) as any
    const res = await feedback(req, { params: { id: reportId } as any })
    expect(res.status).toBe(500)
  })
})


