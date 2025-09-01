import { describe, it, expect, beforeEach, vi } from "vitest"
import type { Mock } from "vitest"
import { NextRequest } from "next/server"

// Mock auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "u1", orgId: "o1" }),
  clerkClient: {
    users: {
      getUser: vi.fn().mockResolvedValue({ id: "u1", emailAddresses: [{ emailAddress: "test@example.com" }] })
    }
  }
}))

// Mock authz
vi.mock("@/lib/authz", () => ({
  assertRoleInOrg: vi
    .fn()
    .mockResolvedValue({ userId: "u1", orgId: "o1", role: "HANDLER" }),
  assertCanAccessReport: vi.fn().mockResolvedValue(true)
}))

// Mock reports service
vi.mock("@/src/server/services/reports", () => ({
  addHandlerMessage: vi.fn()
}))

// Mock audit service
vi.mock("@/src/server/services/audit", () => ({
  writeAudit: vi.fn(),
  getAuditFingerprint: vi.fn().mockResolvedValue({ ipHash: "ip123", uaHash: "ua123" }),
  getCurrentActorOrgMemberId: vi.fn().mockResolvedValue({ orgMemberId: "om1" })
}))

// Mock storage
vi.mock("@/lib/storage/supabase", () => ({
  generatePresignedUploadUrl: vi.fn().mockResolvedValue({
    uploadUrl: "https://upload.example.com",
    storageKey: "files/test.webm",
    token: "token123"
  })
}))

// Mock database
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockReturnValue(undefined)
      })
    }),
    query: {
      organizations: {
        findFirst: vi.fn().mockResolvedValue({ id: "o1", name: "Test Org" })
      },
      reportingChannels: {
        findFirst: vi.fn().mockResolvedValue({ id: "rc1", orgId: "o1", slug: "test-channel" })
      }
    }
  }
}))

// Mock server/orgs
vi.mock("@/src/server/orgs", () => ({
  getDbOrgIdForClerkOrg: vi.fn().mockResolvedValue("o1")
}))

import { assertRoleInOrg, assertCanAccessReport } from "@/lib/authz"
import { addHandlerMessage } from "@/src/server/services/reports"
import { writeAudit, getAuditFingerprint, getCurrentActorOrgMemberId } from "@/src/server/services/audit"
import { generatePresignedUploadUrl } from "@/lib/storage/supabase"
import { POST as postHandlerMessage } from "@/app/api/reports/[id]/messages/route"
import { POST as postPresignUpload } from "@/app/api/files/presign/route"

describe("/api/reports/[id]/messages - Chat Message API", () => {
  const assertRoleInOrgMock = assertRoleInOrg as unknown as Mock
  const assertCanAccessReportMock = assertCanAccessReport as unknown as Mock
  const addHandlerMessageMock = addHandlerMessage as unknown as Mock
  const writeAuditMock = writeAudit as unknown as Mock
  const getAuditFingerprintMock = getAuditFingerprint as unknown as Mock
  const getCurrentActorOrgMemberIdMock = getCurrentActorOrgMemberId as unknown as Mock

  beforeEach(() => {
    vi.clearAllMocks()
    assertRoleInOrgMock.mockResolvedValue({
      userId: "u1",
      orgId: "o1",
      role: "HANDLER"
    })
    assertCanAccessReportMock.mockResolvedValue(true)
    addHandlerMessageMock.mockResolvedValue({ id: "m1" })
  })

  describe("Message Creation", () => {
    it("creates text message successfully", async () => {
      const req = new NextRequest("http://localhost/api/reports/r1/messages", {
        method: "POST",
        body: JSON.stringify({ body: "Hello, this is a test message" }),
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
        body: "Hello, this is a test message",
        actorId: "u1"
      })
    })

    it("creates empty message for file-only uploads", async () => {
      const req = new NextRequest("http://localhost/api/reports/r1/messages", {
        method: "POST",
        body: JSON.stringify({ body: "" }),
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
        body: "",
        actorId: "u1"
      })
    })

    it("rejects missing body when no files", async () => {
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

    it("handles service errors gracefully", async () => {
      addHandlerMessageMock.mockRejectedValueOnce(new Error("Database connection failed"))
      
      const req = new NextRequest("http://localhost/api/reports/r1/messages", {
        method: "POST",
        body: JSON.stringify({ body: "test" }),
        headers: { "content-type": "application/json" }
      }) as any

      const res = await postHandlerMessage(req, {
        params: Promise.resolve({ id: "r1" })
      } as any)

      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toContain("Internal server error")
    })
  })

  describe("Audit Logging", () => {
    it("logs message creation with fingerprint", async () => {
      const req = new NextRequest("http://localhost/api/reports/r1/messages", {
        method: "POST",
        body: JSON.stringify({ body: "Audited message" }),
        headers: { 
          "content-type": "application/json",
          "x-forwarded-for": "192.168.1.1",
          "user-agent": "Mozilla/5.0 Test Browser"
        }
      }) as any

      await postHandlerMessage(req, {
        params: Promise.resolve({ id: "r1" })
      } as any)

      expect(getAuditFingerprintMock).toHaveBeenCalledWith(req)
      expect(getCurrentActorOrgMemberIdMock).toHaveBeenCalled()
      expect(writeAuditMock).toHaveBeenCalledWith({
        orgId: "o1",
        actorId: "om1",
        action: "REPORT_MESSAGE_ADDED",
        targetType: "report",
        targetId: "r1",
        ipHash: "ip123",
        uaHash: "ua123"
      })
    })

    it("continues without audit if fingerprint fails", async () => {
      getAuditFingerprintMock.mockRejectedValueOnce(new Error("Fingerprint failed"))
      
      const req = new NextRequest("http://localhost/api/reports/r1/messages", {
        method: "POST",
        body: JSON.stringify({ body: "Message without audit" }),
        headers: { "content-type": "application/json" }
      }) as any

      const res = await postHandlerMessage(req, {
        params: Promise.resolve({ id: "r1" })
      } as any)

      expect(res.status).toBe(200) // Should still succeed
      expect(addHandlerMessageMock).toHaveBeenCalled()
    })
  })

  describe("Authorization", () => {
    it("requires HANDLER or ADMIN role", async () => {
      assertRoleInOrgMock.mockRejectedValueOnce(new Error("Unauthorized"))
      
      const req = new NextRequest("http://localhost/api/reports/r1/messages", {
        method: "POST",
        body: JSON.stringify({ body: "test" }),
        headers: { "content-type": "application/json" }
      }) as any

      const res = await postHandlerMessage(req, {
        params: Promise.resolve({ id: "r1" })
      } as any)

      expect(res.status).toBe(500)
      expect(assertRoleInOrgMock).toHaveBeenCalledWith(["ADMIN", "HANDLER"])
    })

    it("verifies report access", async () => {
      assertCanAccessReportMock.mockRejectedValueOnce(new Error("Access denied"))
      
      const req = new NextRequest("http://localhost/api/reports/r1/messages", {
        method: "POST",
        body: JSON.stringify({ body: "test" }),
        headers: { "content-type": "application/json" }
      }) as any

      const res = await postHandlerMessage(req, {
        params: Promise.resolve({ id: "r1" })
      } as any)

      expect(res.status).toBe(500)
      expect(assertCanAccessReportMock).toHaveBeenCalledWith({
        orgId: "o1",
        userId: "u1",
        role: "HANDLER",
        reportId: "r1"
      })
    })
  })
})

describe("/api/files/presign - File Upload API", () => {
  const generatePresignedUploadUrlMock = generatePresignedUploadUrl as unknown as Mock
  const writeAuditMock = writeAudit as unknown as Mock

  beforeEach(() => {
    vi.clearAllMocks()
    generatePresignedUploadUrlMock.mockResolvedValue({
      uploadUrl: "https://upload.example.com",
      storageKey: "files/test.webm",
      token: "token123"
    })
  })

  describe("File Presign", () => {
    it("generates presigned URL for message attachment", async () => {
      const req = new NextRequest("http://localhost/api/files/presign", {
        method: "POST",
        body: JSON.stringify({
          filename: "voice-message.webm",
          contentType: "audio/webm",
          size: 1024,
          reportId: "r1",
          messageId: "m1"
        }),
        headers: { "content-type": "application/json" }
      }) as any

      const res = await postPresignUpload(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.uploadUrl).toBe("https://upload.example.com")
      expect(json.storageKey).toBe("files/test.webm")
      expect(json.token).toBe("token123")
      expect(generatePresignedUploadUrlMock).toHaveBeenCalledWith({
        filename: "voice-message.webm",
        contentType: "audio/webm",
        size: 1024,
        checksum: "",
        orgId: "o1",
        reportId: "r1",
        messageId: "m1"
      })
    })

    it("handles optional checksum", async () => {
      const req = new NextRequest("http://localhost/api/files/presign", {
        method: "POST",
        body: JSON.stringify({
          filename: "document.pdf",
          contentType: "application/pdf",
          size: 2048,
          checksum: "sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
          reportId: "r1",
          messageId: "m1"
        }),
        headers: { "content-type": "application/json" }
      }) as any

      const res = await postPresignUpload(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.uploadUrl).toBe("https://upload.example.com")
      expect(generatePresignedUploadUrlMock).toHaveBeenCalledWith({
        filename: "document.pdf",
        contentType: "application/pdf",
        size: 2048,
        checksum: "sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        orgId: "o1",
        reportId: "r1",
        messageId: "m1"
      })
    })

    it("logs attachment creation with metadata", async () => {
      const req = new NextRequest("http://localhost/api/files/presign", {
        method: "POST",
        body: JSON.stringify({
          filename: "voice-message.webm",
          contentType: "audio/webm",
          size: 1024,
          reportId: "r1",
          messageId: "m1"
        }),
        headers: { 
          "content-type": "application/json",
          "x-forwarded-for": "192.168.1.1",
          "user-agent": "Mozilla/5.0 Test Browser"
        }
      }) as any

      await postPresignUpload(req)

      expect(writeAuditMock).toHaveBeenCalledWith({
        orgId: "o1",
        actorId: "om1",
        action: "ATTACHMENT_ADDED",
        targetType: "report",
        targetId: "r1",
        ipHash: "ip123",
        uaHash: "ua123",
        metadata: { 
          filename: "voice-message.webm", 
          size: 1024, 
          messageId: "m1" 
        }
      })
    })

    it("rejects invalid request data", async () => {
      const req = new NextRequest("http://localhost/api/files/presign", {
        method: "POST",
        body: JSON.stringify({
          // Missing required fields
          filename: "test.txt"
        }),
        headers: { "content-type": "application/json" }
      }) as any

      const res = await postPresignUpload(req)
      expect(res.status).toBe(400)
    })
  })
})
