import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Chat from "@/app/(authenticated)/dashboard/cases/[id]/chat"
import { ChatMessage } from "@/components/ui/chat-message"

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

// Mock MediaRecorder API
global.MediaRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  ondataavailable: null,
  onstop: null,
  state: "inactive",
}))

// Mock AudioContext API
global.AudioContext = vi.fn().mockImplementation(() => ({
  createMediaStreamSource: vi.fn().mockReturnValue({
    connect: vi.fn(),
  }),
  createAnalyser: vi.fn().mockReturnValue({
    fftSize: 256,
    frequencyBinCount: 128,
    getByteTimeDomainData: vi.fn(),
  }),
  close: vi.fn(),
}))

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, "mediaDevices", {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    }),
  },
  writable: true,
})

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue("blob:test-url")

describe("ChatMessage Component", () => {
  const defaultProps = {
    isUser: false,
    senderLabel: "REPORTER",
    createdAt: "2024-01-01T12:00:00Z",
    children: <p>Test message</p>,
  }

  it("renders message content correctly", () => {
    render(<ChatMessage {...defaultProps} />)
    expect(screen.getByText("Test message")).toBeInTheDocument()
  })

  it("displays sender label", () => {
    render(<ChatMessage {...defaultProps} />)
    expect(screen.getByText("REPORTER")).toBeInTheDocument()
  })

  it("shows user avatar when provided", () => {
    render(<ChatMessage {...defaultProps} avatarUrl="https://example.com/avatar.jpg" />)
    const avatar = screen.getByAltText("Avatar")
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg")
  })

  it("applies correct styling for user messages", () => {
    render(<ChatMessage {...defaultProps} isUser={true} />)
    const messageContainer = screen.getByText("Test message").closest("div")
    expect(messageContainer).toHaveClass("justify-end")
  })

  it("applies correct styling for non-user messages", () => {
    render(<ChatMessage {...defaultProps} isUser={false} />)
    const messageContainer = screen.getByText("Test message").closest("div")
    expect(messageContainer).toHaveClass("justify-start")
  })
})

describe("Chat Component", () => {
  const defaultMessages = [
    {
      id: "1",
      sender: "REPORTER" as const,
      body: "Hello, I have a report",
      createdAt: "2024-01-01T12:00:00Z",
      avatarUrl: "https://example.com/reporter.jpg",
    },
    {
      id: "2",
      sender: "HANDLER" as const,
      body: "Thank you for your report",
      createdAt: "2024-01-01T12:01:00Z",
      avatarUrl: "https://example.com/handler.jpg",
    },
  ]

  const defaultProps = {
    messages: defaultMessages,
    onSend: vi.fn(),
    submitting: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders messages correctly", () => {
    render(<Chat {...defaultProps} />)
    expect(screen.getByText("Hello, I have a report")).toBeInTheDocument()
    expect(screen.getByText("Thank you for your report")).toBeInTheDocument()
  })

  it("displays sender labels", () => {
    render(<Chat {...defaultProps} />)
    expect(screen.getByText("REPORTER")).toBeInTheDocument()
    expect(screen.getByText("HANDLER")).toBeInTheDocument()
  })

  it("renders textarea for message input", () => {
    render(<Chat {...defaultProps} />)
    const textarea = screen.getByPlaceholderText("Write a message to the sender...")
    expect(textarea).toBeInTheDocument()
  })

  it("sends message on Enter key", async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<Chat {...defaultProps} onSend={onSend} />)
    
    const textarea = screen.getByPlaceholderText("Write a message to the sender...")
    await user.type(textarea, "Test message")
    await user.keyboard("{Enter}")
    
    expect(onSend).toHaveBeenCalledWith({
      text: "Test message",
      files: [],
    })
  })

  it("sends message on Send button click", async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<Chat {...defaultProps} onSend={onSend} />)
    
    const textarea = screen.getByPlaceholderText("Write a message to the sender...")
    await user.type(textarea, "Test message")
    
    const sendButton = screen.getByText("Send")
    await user.click(sendButton)
    
    expect(onSend).toHaveBeenCalledWith({
      text: "Test message",
      files: [],
    })
  })

  it("clears textarea after sending message", async () => {
    const user = userEvent.setup()
    const onSend = vi.fn().mockResolvedValue(undefined)
    render(<Chat {...defaultProps} onSend={onSend} />)
    
    const textarea = screen.getByPlaceholderText("Write a message to the sender...")
    await user.type(textarea, "Test message")
    
    const sendButton = screen.getByText("Send")
    await user.click(sendButton)
    
    await waitFor(() => {
      expect(textarea).toHaveValue("")
    })
  })

  it("disables send button when submitting", () => {
    render(<Chat {...defaultProps} submitting={true} />)
    const sendButton = screen.getByText("Send")
    expect(sendButton).toBeDisabled()
  })

  it("disables send button when no text and no files", () => {
    render(<Chat {...defaultProps} />)
    const sendButton = screen.getByText("Send")
    expect(sendButton).toBeDisabled()
  })

  it("enables send button when text is present", async () => {
    const user = userEvent.setup()
    render(<Chat {...defaultProps} />)
    
    const textarea = screen.getByPlaceholderText("Write a message to the sender...")
    await user.type(textarea, "Test")
    
    const sendButton = screen.getByText("Send")
    expect(sendButton).not.toBeDisabled()
  })

  describe("File Upload", () => {
    it("renders file attachment button", () => {
      render(<Chat {...defaultProps} />)
      const attachButton = screen.getByLabelText("Attach")
      expect(attachButton).toBeInTheDocument()
    })

    it("opens file input when attach button is clicked", async () => {
      const user = userEvent.setup()
      render(<Chat {...defaultProps} />)
      
      const attachButton = screen.getByLabelText("Attach")
      await user.click(attachButton)
      
      // Note: File input is hidden, so we can't directly test its visibility
      // But we can verify the button exists and is clickable
      expect(attachButton).toBeInTheDocument()
    })

    it("displays selected files", async () => {
      const user = userEvent.setup()
      render(<Chat {...defaultProps} />)
      
      const fileInput = screen.getByRole("button", { name: "Attach" }).nextElementSibling
      const file = new File(["test content"], "test.txt", { type: "text/plain" })
      
      await user.upload(fileInput!, file)
      
      expect(screen.getByText("test.txt")).toBeInTheDocument()
      expect(screen.getByText("0 KB")).toBeInTheDocument()
    })

    it("allows removing selected files", async () => {
      const user = userEvent.setup()
      render(<Chat {...defaultProps} />)
      
      const fileInput = screen.getByRole("button", { name: "Attach" }).nextElementSibling
      const file = new File(["test content"], "test.txt", { type: "text/plain" })
      
      await user.upload(fileInput!, file)
      expect(screen.getByText("test.txt")).toBeInTheDocument()
      
      const removeButton = screen.getByText("×")
      await user.click(removeButton)
      
      expect(screen.queryByText("test.txt")).not.toBeInTheDocument()
    })
  })

  describe("Voice Recording", () => {
    it("renders microphone button", () => {
      render(<Chat {...defaultProps} />)
      const micButton = screen.getByLabelText("Start Recording")
      expect(micButton).toBeInTheDocument()
    })

    it("starts recording when microphone button is clicked", async () => {
      const user = userEvent.setup()
      render(<Chat {...defaultProps} />)
      
      const micButton = screen.getByLabelText("Start Recording")
      await user.click(micButton)
      
      // Should show recording indicator
      expect(screen.getByText("Recording...")).toBeInTheDocument()
      expect(screen.getByLabelText("Stop Recording")).toBeInTheDocument()
    })

    it("stops recording when stop button is clicked", async () => {
      const user = userEvent.setup()
      render(<Chat {...defaultProps} />)
      
      const micButton = screen.getByLabelText("Start Recording")
      await user.click(micButton)
      
      const stopButton = screen.getByLabelText("Stop Recording")
      await user.click(stopButton)
      
      // Should hide recording indicator
      expect(screen.queryByText("Recording...")).not.toBeInTheDocument()
      expect(screen.getByLabelText("Start Recording")).toBeInTheDocument()
    })

    it("shows recording timer", async () => {
      const user = userEvent.setup()
      render(<Chat {...defaultProps} />)
      
      const micButton = screen.getByLabelText("Start Recording")
      await user.click(micButton)
      
      // Should show timer (format: MM:SS)
      expect(screen.getByText(/0:0/)).toBeInTheDocument()
    })

    it("shows audio preview for recorded files", async () => {
      const user = userEvent.setup()
      render(<Chat {...defaultProps} />)
      
      const micButton = screen.getByLabelText("Start Recording")
      await user.click(micButton)
      
      const stopButton = screen.getByLabelText("Stop Recording")
      await user.click(stopButton)
      
      // Should show audio preview
      const audioElement = screen.getByRole("audio")
      expect(audioElement).toBeInTheDocument()
    })
  })

  describe("Message Rendering", () => {
    it("renders text messages", () => {
      const messages = [
        {
          id: "1",
          sender: "HANDLER" as const,
          body: "Text message",
          createdAt: "2024-01-01T12:00:00Z",
        },
      ]
      render(<Chat {...defaultProps} messages={messages} />)
      expect(screen.getByText("Text message")).toBeInTheDocument()
    })

    it("renders audio messages", () => {
      const messages = [
        {
          id: "1",
          sender: "HANDLER" as const,
          body: "",
          createdAt: "2024-01-01T12:00:00Z",
          audioUrl: "/api/files/download?key=test.webm",
        },
      ]
      render(<Chat {...defaultProps} messages={messages} />)
      const audioElement = screen.getByRole("audio")
      expect(audioElement).toHaveAttribute("src", "/api/files/download?key=test.webm")
    })

    it("renders file attachments", () => {
      const messages = [
        {
          id: "1",
          sender: "HANDLER" as const,
          body: "Check this file",
          createdAt: "2024-01-01T12:00:00Z",
          attachments: [
            {
              id: "att1",
              filename: "document.pdf",
              storageKey: "files/document.pdf",
              size: 1024,
            },
          ],
        },
      ]
      render(<Chat {...defaultProps} messages={messages} />)
      expect(screen.getByText("document.pdf")).toBeInTheDocument()
      expect(screen.getByText("1 KB")).toBeInTheDocument()
    })

    it("renders mixed content (text + audio + attachments)", () => {
      const messages = [
        {
          id: "1",
          sender: "HANDLER" as const,
          body: "Here's the audio and file",
          createdAt: "2024-01-01T12:00:00Z",
          audioUrl: "/api/files/download?key=test.webm",
          attachments: [
            {
              id: "att1",
              filename: "document.pdf",
              storageKey: "files/document.pdf",
              size: 1024,
            },
          ],
        },
      ]
      render(<Chat {...defaultProps} messages={messages} />)
      
      expect(screen.getByText("Here's the audio and file")).toBeInTheDocument()
      expect(screen.getByRole("audio")).toBeInTheDocument()
      expect(screen.getByText("document.pdf")).toBeInTheDocument()
    })
  })

  describe("Error Handling", () => {
    it("handles microphone access errors", async () => {
      const user = userEvent.setup()
      // Mock getUserMedia to reject
      Object.defineProperty(global.navigator, "mediaDevices", {
        value: {
          getUserMedia: vi.fn().mockRejectedValue(new Error("Permission denied")),
        },
        writable: true,
      })
      
      render(<Chat {...defaultProps} />)
      
      const micButton = screen.getByLabelText("Start Recording")
      await user.click(micButton)
      
      expect(screen.getByText("Permission denied")).toBeInTheDocument()
    })

    it("handles file upload errors gracefully", async () => {
      const user = userEvent.setup()
      const onSend = vi.fn().mockRejectedValue(new Error("Upload failed"))
      render(<Chat {...defaultProps} onSend={onSend} />)
      
      const textarea = screen.getByPlaceholderText("Write a message to the sender...")
      await user.type(textarea, "Test")
      
      const sendButton = screen.getByText("Send")
      await user.click(sendButton)
      
      // Should handle the error gracefully
      expect(onSend).toHaveBeenCalled()
    })
  })
})
