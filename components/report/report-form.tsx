"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { z } from "zod"
import { reportIntakeSchema, type ReportIntake } from "@/lib/validation/report"
import { Button } from "tweakcn/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { getBrowserSupabase } from "@/lib/supabase/client"

async function sha256(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const digest = await crypto.subtle.digest("SHA-256", buf)
  const bytes = new Uint8Array(digest)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
}

type Props = {
  categories: { id: string; name: string }[]
  onSubmit?: (data: ReportIntake) => Promise<void>
  channelSlug?: string
}

export default function ReportForm({
  categories,
  onSubmit,
  channelSlug,
}: Props) {
  type MediaRecorderConstructor = typeof MediaRecorder & {
    isTypeSupported?: (type: string) => boolean
  }

  const [values, setValues] = useState<ReportIntake>({
    categoryId: "",
    body: "",
    anonymous: true,
    contact: undefined,
    attachments: [],
  })
  const [subject, setSubject] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Voice message recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordError, setRecordError] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef = useRef<number | null>(null)
  const levelTimerRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)

  const MAX_SECONDS = 15 * 60 // 15 minutes

  const validator = useMemo(() => reportIntakeSchema, [])

  function setField<K extends keyof ReportIntake>(
    key: K,
    value: ReportIntake[K]
  ) {
    setValues(v => ({ ...v, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    const parsed = validator.safeParse(values)
  

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".") || "form"
        if (!fieldErrors[path]) fieldErrors[path] = issue.message
      }
      setErrors(fieldErrors)
      setSubmitting(false)
      return
    }

    try {
      // If we have files, presign and upload them first to get storageKeys
      let attachmentsForSubmit = values.attachments
      if (files.length > 0) {
        const uploaded: typeof attachmentsForSubmit = []
        const supabase = getBrowserSupabase()
        for (const f of files) {
          const checksum = await sha256(f)
          // Request signed upload (public intake uses channel header/query)
          const presignRes = await fetch(
            `/api/files/presign?channel=${encodeURIComponent(channelSlug || "")}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-channel-slug": channelSlug || ""
              },
              body: JSON.stringify({
                filename: f.name,
                contentType: f.type || "application/octet-stream",
                size: f.size,
                checksum
              })
            }
          )
          if (!presignRes.ok) {
            console.error("presign failed", await presignRes.text())
            throw new Error("Upload presign failed")
          }
          const { uploadUrl, storageKey, token } = await presignRes.json()

          // Upload using supabase-js helper
          const { error: uploadErr } = await supabase.storage
            .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "uploads")
            .uploadToSignedUrl(storageKey, token, f, {
              contentType: f.type || "application/octet-stream"
            })
          if (uploadErr) {
            console.error("upload failed", uploadErr)
            throw new Error("Upload failed")
          }

          uploaded.push({
            filename: f.name,
            size: f.size,
            contentType: f.type || "application/octet-stream",
            checksum,
            storageKey
          })
        }
        attachmentsForSubmit = uploaded
      }
      if (onSubmit) {
        await onSubmit({ ...parsed.data, attachments: attachmentsForSubmit })
      } else {
        // TODO: send subject and uploaded files (presigned flow) as needed
        const res = await fetch(
          `/api/reports?channel=${encodeURIComponent(channelSlug || "")}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-channel-slug": channelSlug || ""
            },
            body: JSON.stringify({
              ...parsed.data,
              subject,
              attachments: attachmentsForSubmit
            })
          }
        )
        if (!res.ok) {
          console.error("Submission failed", await res.text())
          throw new Error("Submission failed")
        }
        const data = await res.json()
        window.location.href = `/receipt/${encodeURIComponent(data.caseId || data.receiptCode || "")}?caseKey=${encodeURIComponent(data.caseKey || data.passphrase || "")}`
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Clean up media resources on unmount
  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop()
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => t.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (timerRef.current) window.clearInterval(timerRef.current)
      if (levelTimerRef.current) window.clearInterval(levelTimerRef.current)
    }
  }, [])

  async function startRecording() {
    try {
      setRecordError(null)
      setRecordSeconds(0)
      setAudioLevel(0)
      chunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream

      // Optional: choose best available MIME type
      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4"
      ]
      let mimeType: string | undefined
      for (const t of preferredTypes) {
        const MR: MediaRecorderConstructor | undefined = (
          window as unknown as { MediaRecorder?: MediaRecorderConstructor }
        ).MediaRecorder
        if (
          MR &&
          typeof MR.isTypeSupported === "function" &&
          MR.isTypeSupported!(t)
        ) {
          mimeType = t
          break
        }
      }

      const mr: MediaRecorder = new MediaRecorder(
        stream,
        mimeType ? ({ mimeType } as MediaRecorderOptions) : undefined
      )
      mediaRecorderRef.current = mr

      mr.ondataavailable = ev => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data)
        }
      }
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || "audio/webm"
        })
        const fileName = `voice-message-${Date.now()}.${blob.type.includes("mp4") ? "m4a" : "webm"}`
        const file = new File([blob], fileName, { type: blob.type })

        // Expose as selectable file and attachment metadata
        setFiles(prev => {
          const next = [...prev, file]
          setValues(v => ({
            ...v,
            attachments: next.map(f => ({
              filename: f.name,
              size: f.size,
              contentType: f.type
            }))
          }))
          return next
        })

        const url = URL.createObjectURL(blob)
        setAudioUrl(url)

        // release devices
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(t => t.stop())
          audioStreamRef.current = null
        }
        if (audioContextRef.current) {
          audioContextRef.current.close()
          audioContextRef.current = null
        }
      }

      // Simple level meter using WebAudio analyser
      const AnyWindow = window as unknown as {
        AudioContext: typeof AudioContext
        webkitAudioContext?: typeof AudioContext
      }
      audioContextRef.current = new (AnyWindow.AudioContext ||
        AnyWindow.webkitAudioContext!)()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      const analyser = audioContextRef.current.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)
      levelTimerRef.current = window.setInterval((): void => {
        if (!analyserRef.current || !dataArrayRef.current) return
        analyserRef.current.getByteTimeDomainData(dataArrayRef.current)
        // Compute rough RMS level 0..1
        let sum = 0
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          const v = (dataArrayRef.current[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / dataArrayRef.current.length)
        setAudioLevel(Math.min(1, rms * 4))
      }, 100)

      mr.start(250)
      setIsRecording(true)
      timerRef.current = window.setInterval((): void => {
        setRecordSeconds(prev => {
          if (prev + 1 >= MAX_SECONDS) {
            stopRecording()
          }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Microphone access denied"
      setRecordError(message)
      setIsRecording(false)
    }
  }

  function stopRecording(): void {
    try {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop()
      }
    } finally {
      setIsRecording(false)
      if (timerRef.current) window.clearInterval(timerRef.current)
      if (levelTimerRef.current) window.clearInterval(levelTimerRef.current)
    }
  }

  function removeVoiceAttachment() {
    setAudioUrl(null)
    setValues(v => ({
      ...v,
      attachments: v.attachments.filter(
        a => !a.filename.startsWith("voice-message-")
      )
    }))
    setFiles(prev => prev.filter(f => !f.name.startsWith("voice-message-")))
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-secondary rounded-2 space-y-4 border-2 p-8"
    >
      <div>
        <h1 className="text-2xl font-bold">Report an issue</h1>
        <p className="text-muted-foreground text-sm">
          Please provide a detailed description of the issue you are
          experiencing.
        </p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Subject</label>
        <Input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Short summary of your report"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Choose how you would like to report
        </label>
        <div className="grid gap-2 md:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className={`p-3 text-left justify-start ${
              !values.anonymous ? "border-primary" : ""
            }`}
            onClick={() => setField("anonymous", false)}
            variant="outline"
            size="sm"
          >
            <div className="font-medium">Report Confidentially</div>
            <div className="text-muted-foreground text-sm">
              Provide optional contact so handlers can reach you.
            </div>
          </Button>
          <Button
            type="button"
            variant="outline"
            className={`p-3 text-left justify-start ${
              values.anonymous ? "border-primary" : ""
            }`}
            onClick={() => setField("anonymous", true)}
            variant="outline"
            size="sm"
          >
            <div className="font-medium">Report Anonymously</div>
            <div className="text-muted-foreground text-sm">
              Do not share identifying information; you will receive a receipt
              and passphrase.
            </div>
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Select categories associated with the case
        </label>
        <Select
          value={values.categoryId}
          onValueChange={val => setField("categoryId", val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors["categoryId"] && (
          <p className="text-sm text-red-600">{errors["categoryId"]}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={values.body}
          onChange={e => setField("body", e.target.value)}
          placeholder="Describe the issue..."
          rows={6}
        />
        {errors["body"] && (
          <p className="text-sm text-red-600">{errors["body"]}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Files</label>

        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="secondary">
              Add attachments
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={e => {
                  const list = e.target.files ? Array.from(e.target.files) : []
                  setFiles(prev => {
                    const next = [...prev, ...list]
                    setValues(v => ({
                      ...v,
                      attachments: next.map(f => ({
                        filename: f.name,
                        size: f.size,
                        contentType: f.type,
                      })),
                    }))
                    return next
                  })
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose files
              </Button>
              {files.length > 0 && (
                <ul className="space-y-1 text-sm">
                  {files.map((f, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between rounded border px-2 py-1"
                    >
                      <span className="max-w-[75%] truncate">
                        {f.name}{" "}
                        <span className="text-muted-foreground">
                          ({Math.ceil(f.size / 1024)} KB)
                        </span>
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-600"
                        onClick={() =>
                          setFiles(prev => {
                            const next = prev.filter((_, i) => i !== idx)
                            setValues(v => ({
                              ...v,
                              attachments: next.map(f => ({
                                filename: f.name,
                                size: f.size,
                                contentType: f.type,
                              })),
                            }))
                            return next
                          })
                        }
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <div className="flex items-center gap-2">
          <input
            id="file-input"
            type="file"
            className="hidden"
            multiple
            onChange={e => {
              const list = e.target.files ? Array.from(e.target.files) : []
              setFiles(prev => {
                const next = [...prev, ...list]
                setValues(v => ({
                  ...v,
                  attachments: next.map(f => ({
                    filename: f.name,
                    size: f.size,
                    contentType: f.type
                  }))
                }))
                return next
              })
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => document.getElementById("file-input")?.click()}
          >
            Choose files
          </Button>
          {files.length > 0 && (
            <span className="text-muted-foreground text-sm">
              {files.length} file(s) selected
            </span>
          )}
        </div>
        {files.length > 0 && (
          <ul className="space-y-1 text-sm">
            {files.map((f, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between rounded border px-2 py-1"
              >
                <span className="max-w-[75%] truncate">
                  {f.name}{" "}
                  <span className="text-muted-foreground">
                    ({Math.ceil(f.size / 1024)} KB)
                  </span>
                </span>
                <Button
                  type="button"
                  className="text-xs text-red-600"
                  variant="link"
                  size="sm"
                  onClick={() =>
                    setFiles(prev => {
                      const next = prev.filter((_, i) => i !== idx)
                      setValues(v => ({
                        ...v,
                        attachments: next.map(f => ({
                          filename: f.name,
                          size: f.size,
                          contentType: f.type
                        }))
                      }))
                      return next
                    })
                  }
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-muted-foreground text-xs">
          Attach any relevant documents or images. (Optional)
        </p>
      </div>

      {/* Voice message */}
      <div className="space-y-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="secondary">
              Voice message
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium">Voice message</div>
                  <div className="text-muted-foreground text-xs">
                    Record up to 15 minutes and attach it to your report.
                  </div>
                </div>
                {audioUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-600"
                    onClick={removeVoiceAttachment}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-muted h-3 w-32 overflow-hidden rounded">
                  <div
                    className="bg-primary h-full transition-[width]"
                    style={{
                      width: `${Math.min(100, Math.round(audioLevel * 100))}%`,
                    }}
                  />
                </div>
                <div className="text-muted-foreground text-xs">
                  {Math.floor(recordSeconds / 60)}:
                  {String(recordSeconds % 60).padStart(2, "0")}
                </div>
                {!isRecording ? (
                  <Button type="button" onClick={startRecording}>
                    Start recording
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={stopRecording}
                    variant="destructive"
                  >
                    Stop
                  </Button>
                )}
              </div>
              {recordError && (
                <p className="text-xs text-red-600">{recordError}</p>
              )}
              {audioUrl && (
                <audio controls src={audioUrl} className="w-full" />
              )}
            </div>

          </PopoverContent>
        </Popover>
=======
            {audioUrl && (
              <Button
                type="button"
                className="text-xs text-red-600"
                onClick={removeVoiceAttachment}
                variant="link"
                size="sm"
              >
                Remove
              </Button>
            )}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="bg-muted h-3 w-32 overflow-hidden rounded">
              <div
                className="bg-primary h-full transition-[width]"
                style={{
                  width: `${Math.min(100, Math.round(audioLevel * 100))}%`
                }}
              />
            </div>
            <div className="text-muted-foreground text-xs">
              {Math.floor(recordSeconds / 60)}:
              {String(recordSeconds % 60).padStart(2, "0")}
            </div>
            {!isRecording ? (
              <Button
                type="button"
                onClick={startRecording}
                variant="default"
                size="sm"
              >
                Start recording
              </Button>
            ) : (
              <Button
                type="button"
                onClick={stopRecording}
                variant="destructive"
                size="sm"
              >
                Stop
              </Button>
            )}
          </div>

          {recordError && (
            <p className="mt-2 text-xs text-red-600">{recordError}</p>
          )}
          {audioUrl && (
            <div className="mt-4">
              <audio controls src={audioUrl} className="w-full" />
            </div>
          )}
        </div>

      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="anonymous"
          checked={values.anonymous}
          onCheckedChange={checked =>
            setField("anonymous", checked === true)
          }
        />
        <label
          htmlFor="anonymous"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Submit anonymously
        </label>
      </div>

      {!values.anonymous && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email (optional)</label>
            <Input
              type="email"
              value={values.contact?.email || ""}
              onChange={e =>
                setField("contact", {
                  ...values.contact,
                  email: e.target.value
                })
              }
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone (optional)</label>
            <Input
              value={values.contact?.phone || ""}
              onChange={e =>
                setField("contact", {
                  ...values.contact,
                  phone: e.target.value
                })
              }
              placeholder="+48 123 456 789"
            />
          </div>
        </div>
      )}

      <Button type="submit" disabled={submitting} variant="primary" size="sm">
        {submitting ? "Submitting..." : "Submit report"}
      </Button>

      <div className="border-secondary mt-4 border-t pt-4">
        <span className="text-muted-foreground block text-center text-xs">
          All communications are encrypted.
        </span>
      </div>
    </form>
  )
}
