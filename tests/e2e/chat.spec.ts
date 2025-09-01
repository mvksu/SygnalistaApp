import { test, expect } from "@playwright/test"

test.describe("Chat Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a case page (you'll need to set up test data)
    await page.goto("/dashboard/cases/test-case-id")
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="chat-container"]', { timeout: 10000 })
  })

  test("sends text message", async ({ page }) => {
    const messageText = "This is a test message"
    
    // Type message in textarea
    const textarea = page.locator('textarea[placeholder="Write a message to the sender..."]')
    await textarea.fill(messageText)
    
    // Click send button
    const sendButton = page.locator('button:has-text("Send")')
    await sendButton.click()
    
    // Wait for message to appear
    await expect(page.locator(`text=${messageText}`)).toBeVisible()
    
    // Verify message is in the chat
    const messageElement = page.locator(`[data-testid="message"]:has-text("${messageText}")`)
    await expect(messageElement).toBeVisible()
  })

  test("sends message with Enter key", async ({ page }) => {
    const messageText = "Message sent with Enter"
    
    // Type message and press Enter
    const textarea = page.locator('textarea[placeholder="Write a message to the sender..."]')
    await textarea.fill(messageText)
    await textarea.press("Enter")
    
    // Wait for message to appear
    await expect(page.locator(`text=${messageText}`)).toBeVisible()
  })

  test("attaches file to message", async ({ page }) => {
    // Create a test file
    const testFile = {
      name: "test-document.txt",
      type: "text/plain",
      content: "This is test file content"
    }
    
    // Click attach button
    const attachButton = page.locator('button[aria-label="Attach"]')
    await attachButton.click()
    
    // Upload file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: testFile.name,
      mimeType: testFile.type,
      buffer: Buffer.from(testFile.content)
    })
    
    // Verify file is displayed
    await expect(page.locator(`text=${testFile.name}`)).toBeVisible()
    
    // Send message with file
    const sendButton = page.locator('button:has-text("Send")')
    await sendButton.click()
    
    // Verify file attachment is in chat
    await expect(page.locator(`text=${testFile.name}`)).toBeVisible()
  })

  test("records and sends voice message", async ({ page }) => {
    // Mock microphone access
    await page.addInitScript(() => {
      // Mock MediaRecorder
      global.MediaRecorder = class {
        start() {}
        stop() {}
        addEventListener() {}
        removeEventListener() {}
        ondataavailable = null
        onstop = null
        state = "inactive"
      }
      
      // Mock getUserMedia
      navigator.mediaDevices.getUserMedia = async () => {
        return {} as MediaStream
      }
    })
    
    // Click microphone button to start recording
    const micButton = page.locator('button[aria-label="Start Recording"]')
    await micButton.click()
    
    // Wait for recording indicator
    await expect(page.locator('text="Recording..."')).toBeVisible()
    
    // Click stop recording
    const stopButton = page.locator('button[aria-label="Stop Recording"]')
    await stopButton.click()
    
    // Verify audio file is created
    await expect(page.locator('audio')).toBeVisible()
    
    // Send voice message
    const sendButton = page.locator('button:has-text("Send")')
    await sendButton.click()
    
    // Verify voice message appears in chat
    await expect(page.locator('audio')).toBeVisible()
  })

  test("handles microphone permission denied", async ({ page }) => {
    // Mock microphone permission denied
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        throw new Error("Permission denied")
      }
    })
    
    // Click microphone button
    const micButton = page.locator('button[aria-label="Start Recording"]')
    await micButton.click()
    
    // Verify error message is displayed
    await expect(page.locator('text="Permission denied"')).toBeVisible()
  })

  test("displays message with mixed content", async ({ page }) => {
    // Send a message with text, audio, and file
    const messageText = "Mixed content message"
    
    // Type text
    const textarea = page.locator('textarea[placeholder="Write a message to the sender..."]')
    await textarea.fill(messageText)
    
    // Add file
    const attachButton = page.locator('button[aria-label="Attach"]')
    await attachButton.click()
    
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: "test-file.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("test content")
    })
    
    // Record audio (mocked)
    await page.addInitScript(() => {
      global.MediaRecorder = class {
        start() {}
        stop() {}
        addEventListener() {}
        removeEventListener() {}
        ondataavailable = null
        onstop = null
        state = "inactive"
      }
      navigator.mediaDevices.getUserMedia = async () => ({} as MediaStream)
    })
    
    const micButton = page.locator('button[aria-label="Start Recording"]')
    await micButton.click()
    
    const stopButton = page.locator('button[aria-label="Stop Recording"]')
    await stopButton.click()
    
    // Send message
    const sendButton = page.locator('button:has-text("Send")')
    await sendButton.click()
    
    // Verify all content is displayed
    await expect(page.locator(`text=${messageText}`)).toBeVisible()
    await expect(page.locator('text="test-file.txt"')).toBeVisible()
    await expect(page.locator('audio')).toBeVisible()
  })

  test("prevents sending empty message", async ({ page }) => {
    // Try to send empty message
    const sendButton = page.locator('button:has-text("Send")')
    
    // Button should be disabled
    await expect(sendButton).toBeDisabled()
    
    // Try to click it
    await sendButton.click()
    
    // No message should be sent
    const messages = page.locator('[data-testid="message"]')
    await expect(messages).toHaveCount(0)
  })

  test("clears input after sending", async ({ page }) => {
    const messageText = "Message to clear"
    
    // Type and send message
    const textarea = page.locator('textarea[placeholder="Write a message to the sender..."]')
    await textarea.fill(messageText)
    
    const sendButton = page.locator('button:has-text("Send")')
    await sendButton.click()
    
    // Verify textarea is cleared
    await expect(textarea).toHaveValue("")
  })

  test("handles network errors gracefully", async ({ page }) => {
    // Mock network error
    await page.route("**/api/reports/*/messages", async route => {
      await route.abort("failed")
    })
    
    // Try to send message
    const textarea = page.locator('textarea[placeholder="Write a message to the sender..."]')
    await textarea.fill("Message that will fail")
    
    const sendButton = page.locator('button:has-text("Send")')
    await sendButton.click()
    
    // Should handle error gracefully (not crash)
    await expect(page.locator('textarea[placeholder="Write a message to the sender..."]')).toBeVisible()
  })

  test("scrolls to bottom on new message", async ({ page }) => {
    // Send multiple messages to create scroll
    for (let i = 1; i <= 5; i++) {
      const textarea = page.locator('textarea[placeholder="Write a message to the sender..."]')
      await textarea.fill(`Message ${i}`)
      
      const sendButton = page.locator('button:has-text("Send")')
      await sendButton.click()
      
      // Wait for message to appear
      await expect(page.locator(`text="Message ${i}"`)).toBeVisible()
    }
    
    // Verify scroll position is at bottom
    const chatContainer = page.locator('[data-testid="chat-container"]')
    const scrollTop = await chatContainer.evaluate(el => el.scrollTop)
    const scrollHeight = await chatContainer.evaluate(el => el.scrollHeight)
    const clientHeight = await chatContainer.evaluate(el => el.clientHeight)
    
    // Should be scrolled to bottom (with small tolerance)
    expect(scrollTop + clientHeight).toBeGreaterThanOrEqual(scrollHeight - 10)
  })

  test("displays message timestamps", async ({ page }) => {
    const messageText = "Timestamped message"
    
    // Send message
    const textarea = page.locator('textarea[placeholder="Write a message to the sender..."]')
    await textarea.fill(messageText)
    
    const sendButton = page.locator('button:has-text("Send")')
    await sendButton.click()
    
    // Verify timestamp is displayed
    const messageElement = page.locator(`[data-testid="message"]:has-text("${messageText}")`)
    await expect(messageElement.locator('[data-testid="timestamp"]')).toBeVisible()
  })

  test("displays sender information", async ({ page }) => {
    const messageText = "Message with sender info"
    
    // Send message
    const textarea = page.locator('textarea[placeholder="Write a message to the sender..."]')
    await textarea.fill(messageText)
    
    const sendButton = page.locator('button:has-text("Send")')
    await sendButton.click()
    
    // Verify sender label is displayed
    const messageElement = page.locator(`[data-testid="message"]:has-text("${messageText}")`)
    await expect(messageElement.locator('text="HANDLER"')).toBeVisible()
  })
})
