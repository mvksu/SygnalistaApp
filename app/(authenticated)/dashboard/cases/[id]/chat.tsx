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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [recordError, setRecordError] = useState<string | null>(null)
  
  // Audio analysis refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const levelTimerRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView()
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const startRecording = async () => {
    try {
      setRecordError(null)
      setRecordSeconds(0)
      setAudioLevel(0)
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      const chunks: Blob[] = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' })
        setFiles(prev => [...prev, file])
        stream.getTracks().forEach(track => track.stop())
      }
      
      // Set up audio analysis for visualization
      const AnyWindow = window as typeof window & {
        AudioContext: typeof AudioContext
        webkitAudioContext?: typeof AudioContext
      }
      audioContextRef.current = new (AnyWindow.AudioContext || AnyWindow.webkitAudioContext!)()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      const analyser = audioContextRef.current.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)
      
      // Start audio level monitoring
      levelTimerRef.current = window.setInterval(() => {
        if (!analyserRef.current || !dataArrayRef.current) return
        analyserRef.current.getByteTimeDomainData(dataArrayRef.current)
        let sum = 0
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          const v = (dataArrayRef.current[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / dataArrayRef.current.length)
        setAudioLevel(Math.min(1, rms * 4))
      }, 100)
      
      // Start recording timer
      timerRef.current = window.setInterval(() => {
        setRecordSeconds(prev => prev + 1)
      }, 1000)
      
      setMediaRecorder(recorder)
      recorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      const message = error instanceof Error ? error.message : "Microphone access denied"
      setRecordError(message)
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
      
      // Clean up timers and audio context
      if (timerRef.current) window.clearInterval(timerRef.current)
      if (levelTimerRef.current) window.clearInterval(levelTimerRef.current)
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      
      // Reset state
      setAudioLevel(0)
      setRecordSeconds(0)
    }
  }

  return (
    <ScrollArea className="bg-background w-full flex-1 shadow-md min-[1024px]:rounded-e-3xl md:rounded-s-[inherit] [&>div>div]:h-full">
      <div className="flex h-full w-full flex-col px-4 md:px-6 lg:px-8">
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
            {[...messages].map(m => (
              <>
                {m.body && m.audioUrl ? (
                  <>
                                         <ChatMessage
                       key={m.id}
                       isUser={m.sender === "HANDLER" || m.sender === "ADMIN"}
                       senderLabel={m.sender}
                       createdAt={m.createdAt}
                       avatarUrl={m.avatarUrl}
                     >
                       <div className="space-y-2">
                         {m.body && <p>{m.body}</p>}
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
                                 <span className="max-w-[180px] truncate font-mono">
                                   {att.filename}
                                 </span>
                                 <span className="text-muted-foreground">
                                   {Math.round(att.size / 1024)} KB
                                 </span>
                               </a>
                             ))}
                           </div>
                         )}
                       </div>
                     </ChatMessage>
                    <ChatMessage
                      key={m.id + 1}
                      isUser={m.sender === "HANDLER" || m.sender === "ADMIN"}
                      senderLabel={m.sender}
                      createdAt={m.createdAt}
                      avatarUrl={m.avatarUrl}
                    >
                      <div className="space-y-2">
                        <audio controls src={m.audioUrl} className="w-full">
                          Your browser does not support the audio element.
                        </audio>
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
                                <span className="max-w-[180px] truncate font-mono">
                                  {att.filename}
                                </span>
                                <span className="text-muted-foreground">
                                  {Math.round(att.size / 1024)} KB
                                </span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </ChatMessage>
                  </>
                ) : (
                  <div>
                    <ChatMessage
                      key={m.id}
                      isUser={m.sender === "HANDLER" || m.sender === "ADMIN"}
                      senderLabel={m.sender}
                      createdAt={m.createdAt}
                      avatarUrl={m.avatarUrl}
                    >
                      <div className="space-y-2">
                          {m.body && <p>{m.body}</p>}
                          {m.audioUrl && <audio controls src={m.audioUrl} className="w-full">
                          Your browser does not support the audio element.
                        </audio>}
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
                                <span className="max-w-[180px] truncate font-mono">
                                  {att.filename}
                                </span>
                                <span className="text-muted-foreground">
                                  {Math.round(att.size / 1024)} KB
                                </span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </ChatMessage>
                  </div>
                )}
              </>
            ))}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>
        </div>
        {/* Footer */}
        <div className="sticky bottom-0 z-50 pt-4 md:pt-8">
          <div className="bg-background rounded-[20px] pb-4 md:pb-8">
            <div className="bg-muted focus-within:bg-muted/50 focus-within:border-input relative rounded-[20px] border border-transparent transition-colors">
              <textarea
                className="text-foreground placeholder:text-muted-foreground/70 flex w-full [resize:none] bg-transparent px-4 py-3 text-[15px] leading-relaxed focus-visible:outline-none sm:min-h-[84px]"
                placeholder="Write a message to the sender..."
                aria-label="Enter your prompt"
                value={text}
                onChange={e => setText(e.target.value)}
                                 onKeyDown={e => {
                   if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault()
                     if (text.trim() || files.length > 0) {
                       onSend({ text: text.trim(), files })
                       setText("")
                       setFiles([])
                     }
                   }
                 }}
              />
              {/* Recording indicator */}
              {isRecording && (
                <div className="px-4 pb-2">
                  <div className="flex items-center gap-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
                    <span>Recording...</span>
                    <div className="bg-red-200 h-3 w-24 overflow-hidden rounded">
                      <div
                        className="bg-red-600 h-full transition-[width]"
                        style={{
                          width: `${Math.min(100, Math.round(audioLevel * 100))}%`
                        }}
                      />
                    </div>
                    <span className="text-xs">
                      {Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, "0")}
                    </span>
                  </div>
                  {recordError && (
                    <div className="mt-2 text-xs text-red-600">{recordError}</div>
                  )}
                </div>
              )}
              {/* Selected files indicator */}
              {files.length > 0 && (
                <div className="px-4 pb-2">
                  <div className="flex flex-col gap-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded border bg-background px-2 py-1 text-xs"
                      >
                        <span className="max-w-[120px] truncate">{file.name}</span>
                        <span className="text-muted-foreground">
                          {Math.round(file.size / 1024)} KB
                        </span>
                        {/* Audio preview for voice messages */}
                        {file.type.startsWith('audio/') && (
                          <audio 
                            controls 
                            src={URL.createObjectURL(file)} 
                            className="h-6 w-24"
                          />
                        )}
                        <button
                          onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Textarea buttons */}
              <div className="flex items-center justify-between gap-2 p-3">
                {/* Left buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="hover:bg-background size-8 border-none transition-[box-shadow] hover:shadow-md"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <Paperclip
                      className="text-muted-foreground/70 size-5"
                      size={20}
                      aria-hidden="true"
                    />
                    <span className="sr-only">Attach</span>
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="*/*"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className={`hover:bg-background size-8 border-none transition-[box-shadow] hover:shadow-md ${isRecording ? 'bg-red-100 text-red-600' : ''}`}
                    onClick={isRecording ? stopRecording : startRecording}
                    type="button"
                  >
                    <Mic
                      className={`size-5 ${isRecording ? 'text-red-600' : 'text-muted-foreground/70'}`}
                      size={20}
                      aria-hidden="true"
                    />
                    <span className="sr-only">{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
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
                                     <Button
                     className="h-8"
                     disabled={submitting || (!text.trim() && files.length === 0)}
                     onClick={async () => {
                       await onSend({ text: text.trim(), files })
                       setText("")
                       setFiles([])
                     }}
                   >
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
