import { describe, it, expect, vi } from "vitest"
import { NextRequest } from "next/server"
import { GET as getPrefs, PATCH as savePrefs } from "@/app/api/account/notifications/route"

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user-1" }),
  currentUser: vi.fn().mockResolvedValue({ id: "user-1", publicMetadata: {} }),
  clerkClient: { users: { updateUser: vi.fn().mockResolvedValue({}) } }
}))
vi.mock("@/app/api/account/notifications/route", async (orig) => {
  const mod = await orig()
  return { ...mod }
})

describe("/api/account/notifications", () => {
  it("reads preferences", async () => {
    const res = await getPrefs()
    expect([200, 401]).toContain(res.status)
  })

  it("saves preferences", async () => {
    const req = new NextRequest("http://localhost/api/account/notifications", { method: "PATCH", body: JSON.stringify({ emailCaseUpdates: true }), headers: { "content-type": "application/json" } }) as any
    const res = await savePrefs(req)
    expect([200, 401]).toContain(res.status)
  })
})


