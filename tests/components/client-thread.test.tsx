import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import CaseThreadClient from "@/app/(authenticated)/dashboard/cases/[id]/client-thread"

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/test",
}))

// Mock fetch
global.fetch = vi.fn()

// Mock crypto.randomUUID
Object.defineProperty(global.crypto, "randomUUID", {
  value: vi.fn().mockReturnValue("test-uuid-123"),
  writable: true,
})

describe("CaseThreadClient Component", () => {
  const defaultProps = {
    reportId: "r1",
    initialThread: [
      {
        id: "1",
        sender: "REPORTER" as const,
        body: "Initial report",
        createdAt: "2024-01-01T12:00:00Z",
        avatarUrl: "https://example.com/reporter.jpg",
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset fetch mock
    ;(global.fetch as any).mockReset()
  })

  describe("Initial Rendering", () => {
    it("renders initial thread messages", () => {
      render(<CaseThreadClient {...defaultProps} />)
      expect(screen.getByText("Initial report")).toBeInTheDocument()
      expect(screen.getByText("REPORTER")).toBeInTheDocument()
    })

    it("renders empty thread", () => {
      render(<CaseThreadClient {...defaultProps} initialThread={[]} />)
      expect(screen.getByPlaceholderText("Write a message to the sender...")).toBeInTheDocument()
    })
  })

  describe("Message Sending", () => {
    it("sends text message successfully", async () => {
      const user = userEvent.setup()
      
      // Mock successful message creation
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ messageId: "m1" }),
        })

      render(<CaseThreadClient {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText("Write a message to the sender...")
      await user.type(textarea, "Test message")
      
      const sendButton = screen.getByText("Send")
      await user.click(sendButton)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/reports/r1/messages",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body: "Test message" }),
          })
        )
      })
    })

    it("sends empty message for file-only uploads", async () => {
      const user = userEvent.setup()
      
      // Mock successful message creation
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ messageId: "m1" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            uploadUrl: "https://upload.example.com",
            storageKey: "files/test.txt",
            token: "token123",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
        })

      render(<CaseThreadClient {...defaultProps} />)
      
      // Add a file without text
      const fileInput = screen.getByRole("button", { name: "Attach" }).nextElementSibling
      const file = new File(["test content"], "test.txt", { type: "text/plain" })
      
      await user.upload(fileInput!, file)
      
      const sendButton = screen.getByText("Send")
      await user.click(sendButton)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/reports/r1/messages",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body: "" }),
          })
        )
      })
    })

    it("prevents sending when no text and no files", async () => {
      const user = userEvent.setup()
      render(<CaseThreadClient {...defaultProps} />)
      
      const sendButton = screen.getByText("Send")
      expect(sendButton).toBeDisabled()
      
      await user.click(sendButton)
      
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it("handles message creation errors", async () => {
      const user = userEvent.setup()
      
      // Mock failed message creation
      ;(global.fetch as any).mockRejectedValueOnce(new Error("Network error"))
      
      render(<CaseThreadClient {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText("Write a message to the sender...")
      await user.type(textarea, "Test message")
      
      const sendButton = screen.getByText("Send")
      await user.click(sendButton)
      
      // Should handle error gracefully
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })
  })

  describe("File Upload", () => {
    it("uploads file attachment successfully", async () => {
      const user = userEvent.setup()
      
      // Mock successful message creation and file upload
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ messageId: "m1" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            uploadUrl: "https://upload.example.com",
            storageKey: "files/test.txt",
            token: "token123",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
        })

      render(<CaseThreadClient {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText("Write a message to the sender...")
      await user.type(textarea, "Check this file")
      
      const fileInput = screen.getByRole("button", { name: "Attach" }).nextElementSibling
      const file = new File(["test content"], "test.txt", { type: "text/plain" })
      
      await user.upload(fileInput!, file)
      
      const sendButton = screen.getByText("Send")
      await user.click(sendButton)
      
      await waitFor(() => {
        // Should call presign endpoint
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/files/presign",
          expect.objectContaining({
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              filename: "test.txt",
              contentType: "text/plain",
              size: 12,
              reportId: "r1",
              messageId: "m1",
            }),
          })
        )
        
        // Should upload file
        expect(global.fetch).toHaveBeenCalledWith(
          "https://upload.example.com",
          expect.objectContaining({
            method: "POST",
            headers: { authorization: "Bearer token123" },
          })
        )
      })
    })

    it("handles audio file uploads", async () => {
      const user = userEvent.setup()
      
      // Mock successful message creation and file upload
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ messageId: "m1" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            uploadUrl: "https://upload.example.com",
            storageKey: "files/voice.webm",
            token: "token123",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
        })

      render(<CaseThreadClient {...defaultProps} />)
      
      const fileInput = screen.getByRole("button", { name: "Attach" }).nextElementSibling
      const audioFile = new File(["audio content"], "voice.webm", { type: "audio/webm" })
      
      await user.upload(fileInput!, audioFile)
      
      const sendButton = screen.getByText("Send")
      await user.click(sendButton)
      
      await waitFor(() => {
        // Should call presign endpoint for audio file
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/files/presign",
          expect.objectContaining({
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              filename: "voice.webm",
              contentType: "audio/webm",
              size: 13,
              reportId: "r1",
              messageId: "m1",
            }),
          })
        )
      })
    })

    it("handles file upload errors", async () => {
      const user = userEvent.setup()
      
      // Mock successful message creation but failed file upload
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ messageId: "m1" }),
        })
        .mockRejectedValueOnce(new Error("Upload failed"))
      
      render(<CaseThreadClient {...defaultProps} />)
      
      const fileInput = screen.getByRole("button", { name: "Attach" }).nextElementSibling
      const file = new File(["test content"], "test.txt", { type: "text/plain" })
      
      await user.upload(fileInput!, file)
      
      const sendButton = screen.getByText("Send")
      await user.click(sendButton)
      
      // Should handle error gracefully
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })
  })

  describe("Voice Recording", () => {
    it("records and uploads voice message", async () => {
      const user = userEvent.setup()
      
      // Mock MediaRecorder
      const mockMediaRecorder = {
        start: vi.fn(),
        stop: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        ondataavailable: null,
        onstop: null,
        state: "inactive",
      }
      ;(global.MediaRecorder as any).mockImplementation(() => mockMediaRecorder)
      
      // Mock successful message creation and file upload
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ messageId: "m1" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            uploadUrl: "https://upload.example.com",
            storageKey: "files/voice-message.webm",
            token: "token123",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
        })

      render(<CaseThreadClient {...defaultProps} />)
      
      // Start recording
      const micButton = screen.getByLabelText("Start Recording")
      await user.click(micButton)
      
      // Stop recording
      const stopButton = screen.getByLabelText("Stop Recording")
      await user.click(stopButton)
      
      // Send the voice message
      const sendButton = screen.getByText("Send")
      await user.click(sendButton)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/files/presign",
          expect.objectContaining({
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              filename: expect.stringContaining("voice-message-"),
              contentType: "audio/webm",
              size: expect.any(Number),
              reportId: "r1",
              messageId: "m1",
            }),
          })
        )
      })
    })

    it("handles recording errors", async () => {
      const user = userEvent.setup()
      
      // Mock getUserMedia to reject
      Object.defineProperty(global.navigator, "mediaDevices", {
        value: {
          getUserMedia: vi.fn().mockRejectedValue(new Error("Permission denied")),
        },
        writable: true,
      })
      
      render(<CaseThreadClient {...defaultProps} />)
      
      const micButton = screen.getByLabelText("Start Recording")
      await user.click(micButton)
      
      expect(screen.getByText("Permission denied")).toBeInTheDocument()
    })
  })

  describe("Optimistic Updates", () => {
    it("shows optimistic message immediately", async () => {
      const user = userEvent.setup()
      
      // Mock successful message creation
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ messageId: "m1" }),
      })

      render(<CaseThreadClient {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText("Write a message to the sender...")
      await user.type(textarea, "Optimistic message")
      
      const sendButton = screen.getByText("Send")
      await user.click(sendButton)
      
      // Should show message immediately
      await waitFor(() => {
        expect(screen.getByText("Optimistic message")).toBeInTheDocument()
      })
    })

    it("updates message with attachments", async () => {
      const user = userEvent.setup()
      
      // Mock successful message creation and file upload
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ messageId: "m1" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            uploadUrl: "https://upload.example.com",
            storageKey: "files/test.txt",
            token: "token123",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
        })

      render(<CaseThreadClient {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText("Write a message to the sender...")
      await user.type(textarea, "Message with file")
      
      const fileInput = screen.getByRole("button", { name: "Attach" }).nextElementSibling
      const file = new File(["test content"], "test.txt", { type: "text/plain" })
      
      await user.upload(fileInput!, file)
      
      const sendButton = screen.getByText("Send")
      await user.click(sendButton)
      
      // Should show message with attachment
      await waitFor(() => {
        expect(screen.getByText("Message with file")).toBeInTheDocument()
        expect(screen.getByText("test.txt")).toBeInTheDocument()
      })
    })
  })

  describe("State Management", () => {
    it("clears input after sending", async () => {
      const user = userEvent.setup()
      
      // Mock successful message creation
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ messageId: "m1" }),
      })

      render(<CaseThreadClient {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText("Write a message to the sender...")
      await user.type(textarea, "Test message")
      
      const sendButton = screen.getByText("Send")
      await user.click(sendButton)
      
      await waitFor(() => {
        expect(textarea).toHaveValue("")
      })
    })

    it("clears files after sending", async () => {
      const user = userEvent.setup()
      
      // Mock successful message creation and file upload
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ messageId: "m1" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            uploadUrl: "https://upload.example.com",
            storageKey: "files/test.txt",
            token: "token123",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
        })

      render(<CaseThreadClient {...defaultProps} />)
      
      const fileInput = screen.getByRole("button", { name: "Attach" }).nextElementSibling
      const file = new File(["test content"], "test.txt", { type: "text/plain" })
      
      await user.upload(fileInput!, file)
      expect(screen.getByText("test.txt")).toBeInTheDocument()
      
      const sendButton = screen.getByText("Send")
      await user.click(sendButton)
      
      await waitFor(() => {
        expect(screen.queryByText("test.txt")).not.toBeInTheDocument()
      })
    })
  })
})
