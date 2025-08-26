import { describe, it, expect, vi, beforeAll } from "vitest"
import { NextRequest } from "next/server"
import { GET as listDepartments, POST as createDepartment } from "@/app/api/departments/route"
import { db } from "@/db"
import { organizations } from "@/db/schema/organizations"

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn().mockResolvedValue({ orgId: "clerk-org-dept" }) }))
vi.mock("@/src/server/orgs", () => ({ getDbOrgIdForClerkOrg: vi.fn().mockResolvedValue("00000000-0000-0000-0000-00000000d001") }))

describe("/api/departments", () => {
  beforeAll(async () => {
    await db.insert(organizations).values({ id: "00000000-0000-0000-0000-00000000d001", clerkOrgId: "clerk-org-dept", name: "Dept Org", slug: "dept-org" }).onConflictDoNothing()
  })

  it("lists departments for org", async () => {
    const res = await listDepartments()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
  })

  it("creates a department via JSON", async () => {
    const req = new NextRequest("http://localhost/api/departments", { method: "POST", body: JSON.stringify({ name: "Risk" }), headers: { "content-type": "application/json" } }) as any
    const res = await createDepartment(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.name).toBe("Risk")
  })
})


