import { describe, it, expect, beforeEach, vi } from "vitest"
import type { Mock } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/authz", () => ({
  assertRoleInOrg: vi
    .fn()
    .mockResolvedValue({ userId: "u1", orgId: "o1", role: "HANDLER" }),
  assertCanAccessReport: vi.fn().mockResolvedValue(true)
}))

vi.mock("@/src/server/services/reports", () => ({
  addHandlerMessage: vi.fn()
}))

import { assertRoleInOrg, assertCanAccessReport } from "@/lib/authz"
import { addHandlerMessage } from "@/src/server/services/reports"
import { POST as postHandlerMessage } from "@/app/api/reports/[id]/messages/route"

describe("/api/reports/[id]/messages - handler flow", () => {
  const assertRoleInOrgMock = assertRoleInOrg as unknown as Mock
  const assertCanAccessReportMock = assertCanAccessReport as unknown as Mock
  const addHandlerMessageMock = addHandlerMessage as unknown as Mock

  beforeEach(() => {
    vi.clearAllMocks()
    assertRoleInOrgMock.mockResolvedValue({
      userId: "u1",
      orgId: "o1",
      role: "HANDLER"
    })
    assertCanAccessReportMock.mockResolvedValue(true)
  })

  it("rejects missing body", async () => {
    const req = new NextRequest("http://localhost/api/reports/r1/messages", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" }
    }) as any
    const res = await postHandlerMessage(req, {
      params: Promise.resolve({ id: "r1" })
    } as any)
    expect(res.status).toBe(400)
    expect(addHandlerMessageMock).not.toHaveBeenCalled()
  })

  it("adds handler message", async () => {
    addHandlerMessageMock.mockResolvedValueOnce({ id: "m1" })
    const req = new NextRequest("http://localhost/api/reports/r1/messages", {
      method: "POST",
      body: JSON.stringify({ body: "hello" }),
      headers: { "content-type": "application/json" }
    }) as any
    const res = await postHandlerMessage(req, {
      params: Promise.resolve({ id: "r1" })
    } as any)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.messageId).toBe("m1")
    expect(addHandlerMessageMock).toHaveBeenCalledWith({
      orgId: "o1",
      reportId: "r1",
      body: "hello",
      actorId: "u1"
    })
    expect(assertRoleInOrgMock).toHaveBeenCalledWith(["ADMIN", "HANDLER"])
    expect(assertCanAccessReportMock).toHaveBeenCalledWith({
      orgId: "o1",
      userId: "u1",
      role: "HANDLER",
      reportId: "r1"
    })
  })

  it("handles service errors", async () => {
    addHandlerMessageMock.mockRejectedValueOnce(new Error("boom"))
    const req = new NextRequest("http://localhost/api/reports/r1/messages", {
      method: "POST",
      body: JSON.stringify({ body: "hello" }),
      headers: { "content-type": "application/json" }
    }) as any
    const res = await postHandlerMessage(req, {
      params: Promise.resolve({ id: "r1" })
    } as any)
    expect(res.status).toBe(500)
  })
})
