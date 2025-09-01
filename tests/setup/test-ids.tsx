// Test ID constants for chat components
export const CHAT_TEST_IDS = {
  // Chat container
  CHAT_CONTAINER: "chat-container",
  
  // Message elements
  MESSAGE: "message",
  MESSAGE_TEXT: "message-text",
  MESSAGE_AUDIO: "message-audio",
  MESSAGE_ATTACHMENT: "message-attachment",
  MESSAGE_TIMESTAMP: "message-timestamp",
  MESSAGE_SENDER: "message-sender",
  
  // Input elements
  MESSAGE_INPUT: "message-input",
  SEND_BUTTON: "send-button",
  ATTACH_BUTTON: "attach-button",
  MIC_BUTTON: "mic-button",
  FILE_INPUT: "file-input",
  
  // Recording elements
  RECORDING_INDICATOR: "recording-indicator",
  RECORDING_TIMER: "recording-timer",
  RECORDING_VOLUME: "recording-volume",
  RECORDING_ERROR: "recording-error",
  
  // File elements
  FILE_PREVIEW: "file-preview",
  FILE_REMOVE: "file-remove",
  AUDIO_PREVIEW: "audio-preview",
  
  // Status elements
  SUBMITTING_INDICATOR: "submitting-indicator",
  ERROR_MESSAGE: "error-message",
} as const

// Instructions for adding test IDs to components:
/*
1. Chat Component (app/(authenticated)/dashboard/cases/[id]/chat.tsx):
   - Add data-testid="chat-container" to the main ScrollArea div
   - Add data-testid="message-input" to the textarea
   - Add data-testid="send-button" to the Send button
   - Add data-testid="attach-button" to the Paperclip button
   - Add data-testid="mic-button" to the Mic button
   - Add data-testid="file-input" to the hidden file input
   - Add data-testid="recording-indicator" to the recording div
   - Add data-testid="recording-timer" to the timer span
   - Add data-testid="recording-volume" to the volume bar
   - Add data-testid="recording-error" to the error div
   - Add data-testid="file-preview" to each file preview div
   - Add data-testid="file-remove" to each remove button
   - Add data-testid="audio-preview" to each audio element

2. ChatMessage Component (components/ui/chat-message.tsx):
   - Add data-testid="message" to the main message div
   - Add data-testid="message-text" to the text paragraph
   - Add data-testid="message-audio" to the audio element
   - Add data-testid="message-attachment" to each attachment link
   - Add data-testid="message-timestamp" to the timestamp
   - Add data-testid="message-sender" to the sender label

3. Client Thread Component (app/(authenticated)/dashboard/cases/[id]/client-thread.tsx):
   - Add data-testid="submitting-indicator" when submitting is true
   - Add data-testid="error-message" to any error displays

Example usage:
```tsx
// In chat.tsx
<ScrollArea data-testid="chat-container" className="...">
  <textarea data-testid="message-input" ... />
  <button data-testid="send-button" ...>Send</button>
</ScrollArea>

// In chat-message.tsx
<div data-testid="message" className="...">
  <p data-testid="message-text">{children}</p>
  <span data-testid="message-timestamp">{createdAt}</span>
  <span data-testid="message-sender">{senderLabel}</span>
</div>
```
*/

export default CHAT_TEST_IDS
