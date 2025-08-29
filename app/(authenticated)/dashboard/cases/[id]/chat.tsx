"use client"


import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

import { ChatMessage } from "@/components/ui/chat-message"
import { useRef, useEffect, useState } from "react"
import {
  Code2,
  Share,
  Share2,
  Sparkles,
  Paperclip,
  Mic,
  Leaf
} from "lucide-react"

type Message = {
  id: string
  sender: "REPORTER" | "HANDLER" | "SYSTEM" | "BOT" | "ADMIN"
  body: string
  createdAt: string
  avatarUrl?: string
  attachments?: Array<{ id: string; filename: string; storageKey: string; size: number }>
  audioUrl?: string
}

export default function Chat({
  messages,
  onSend,
  submitting
}: {
  messages: Message[]
  onSend: (input: { text: string; files: File[] }) => Promise<void>
  submitting?: boolean
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [text, setText] = useState("")
  const [files, setFiles] = useState<File[]>([])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView()
  }, [])

  return (
    <ScrollArea className="bg-background w-full flex-1 shadow-md min-[1024px]:rounded-e-3xl md:rounded-s-[inherit] [&>div>div]:h-full">
      <div className="flex h-full flex-col px-4 md:px-6 lg:px-8 w-full">
     
        {/* Chat */}
        <div className="relative grow">
          <div className="mt-6 space-y-6">
            <div className="my-8 text-center">
              <div className="text-foreground/80 inline-flex items-center rounded-full border border-black/[0.08] bg-white px-3 py-1 text-xs font-medium shadow-xs">
                <Sparkles
                  className="text-muted-foreground/70 -ms-1 me-1.5"
                  size={14}
                  aria-hidden="true"
                />
                Today
              </div>
            </div>
            {messages.map(m => (
              <ChatMessage
                key={m.id}
                isUser={m.sender === "HANDLER"}
                senderLabel={m.sender}
                createdAt={m.createdAt}
                avatarUrl={m.avatarUrl}
              >
                <div className="space-y-2">
                  {m.audioUrl ? (
                    <audio controls src={m.audioUrl} className="w-full">
                      Your browser does not support the audio element.
                    </audio>
                  ) : (
                    <p>{m.body}</p>
                  )}
                  {!!m.attachments?.length && (
                    <div className="mt-1 grid gap-2">
                      {m.attachments.map(att => (
                        <a
                          key={att.id}
                          href={`/api/files/download?key=${encodeURIComponent(att.storageKey)}`}
                          className="inline-flex items-center gap-2 rounded border px-2 py-1 text-xs"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="font-mono truncate max-w-[180px]">{att.filename}</span>
                          <span className="text-muted-foreground">{Math.round(att.size / 1024)} KB</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </ChatMessage>
            ))}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>
        </div>
        {/* Footer */}
        <div className="sticky bottom-0 z-50 pt-4 md:pt-8">
          <div className="bg-background rounded-[20px] pb-4 md:pb-8">
            <div className="bg-muted focus-within:bg-muted/50 focus-within:border-input relative rounded-[20px] border border-transparent transition-colors has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 [&:has(input:is(:disabled))_*]:pointer-events-none">
              <textarea
                className="text-foreground placeholder:text-muted-foreground/70 flex w-full [resize:none] bg-transparent px-4 py-3 text-[15px] leading-relaxed focus-visible:outline-none sm:min-h-[84px]"
                placeholder="Write a message to the sender..."
                aria-label="Enter your prompt"
                value={text}
                onChange={e => setText(e.target.value)}
              />
              {/* Textarea buttons */}
              <div className="flex items-center justify-between gap-2 p-3">
                {/* Left buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="hover:bg-background size-8 border-none transition-[box-shadow] hover:shadow-md"
                  >
                    <Paperclip
                      className="text-muted-foreground/70 size-5"
                      size={20}
                      aria-hidden="true"
                    />
                    <span className="sr-only">Attach</span>
                  </Button>
                  <input type="file" multiple onChange={e => setFiles(Array.from(e.target.files || []))} className="hidden" />
                  <Button
                    variant="outline"
                    size="icon"
                    className="hover:bg-background size-8 border-none transition-[box-shadow] hover:shadow-md"
                  >
                    <Mic
                      className="text-muted-foreground/70 size-5"
                      size={20}
                      aria-hidden="true"
                    />
                    <span className="sr-only">Audio</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="hover:bg-background size-8 rounded-full border-none transition-[box-shadow] hover:shadow-md"
                  >
                    <Leaf
                      className="text-muted-foreground/70 size-5"
                      size={20}
                      aria-hidden="true"
                    />
                    <span className="sr-only">Action</span>
                  </Button>
                </div>
                {/* Right buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="hover:bg-background size-8 rounded-full border-none transition-[box-shadow] hover:shadow-md"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="none"
                    >
                      <g clipPath="url(#icon-a)">
                        <path
                          fill="url(#icon-b)"
                          d="m8 .333 2.667 5 5 2.667-5 2.667-2.667 5-2.667-5L.333 8l5-2.667L8 .333Z"
                        />
                        <path
                          stroke="#451A03"
                          strokeOpacity=".04"
                          d="m8 1.396 2.225 4.173.072.134.134.071L14.604 8l-4.173 2.226-.134.071-.072.134L8 14.604l-2.226-4.173-.071-.134-.134-.072L1.396 8l4.173-2.226.134-.071.071-.134L8 1.396Z"
                        />
                      </g>
                      <defs>
                        <linearGradient
                          id="icon-b"
                          x1="8"
                          x2="8"
                          y1=".333"
                          y2="15.667"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor="#FDE68A" />
                          <stop offset="1" stopColor="#F59E0B" />
                        </linearGradient>
                        <clipPath id="icon-a">
                          <path fill="#fff" d="M0 0h16v16H0z" />
                        </clipPath>
                      </defs>
                    </svg>
                    <span className="sr-only">Generate</span>
                  </Button>
                  <Button className="h-8" disabled={submitting} onClick={async () => { await onSend({ text, files }); setText(""); setFiles([]); }}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
