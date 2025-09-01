"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface SettingsFormProps {
  org: {
    name?: string
    locale?: string
    retentionDays?: number
    anonymousAllowed?: boolean
    ackDays?: number
    feedbackMonths?: number
    slaEnabled?: boolean
  }
}

export function SettingsForm({ org }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: org?.name || "",
    locale: org?.locale || "pl-PL",
    retentionDays: org?.retentionDays || 365,
    anonymousAllowed: org?.anonymousAllowed ?? true,
    ackDays: org?.ackDays ?? 7,
    feedbackMonths: org?.feedbackMonths ?? 3,
    slaEnabled: org?.slaEnabled ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update settings")
      }

      setSuccess(true)
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="rounded border p-4 grid gap-3 text-sm">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Settings updated successfully!</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-1">
        <label className="text-muted-foreground">Name</label>
        <input
          name="name"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          className="rounded border px-2 py-1"
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-1">
        <label className="text-muted-foreground">Default language</label>
        <select
          name="locale"
          value={formData.locale}
          onChange={(e) => handleInputChange("locale", e.target.value)}
          className="rounded border px-2 py-1 max-w-xs"
          disabled={isLoading}
        >
          <option value="en-US">English</option>
          <option value="pl-PL">Polski</option>
        </select>
      </div>

      <div className="grid gap-1 max-w-xs">
        <label className="text-muted-foreground">Retention (days)</label>
        <input
          type="number"
          name="retentionDays"
          value={formData.retentionDays}
          onChange={(e) => handleInputChange("retentionDays", Number(e.target.value))}
          className="rounded border px-2 py-1"
          min="1"
          max="3650"
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-1 max-w-xs">
        <label className="text-muted-foreground">Acknowledge window (days)</label>
        <input
          type="number"
          name="ackDays"
          value={formData.ackDays}
          onChange={(e) => handleInputChange("ackDays", Number(e.target.value))}
          className="rounded border px-2 py-1"
          min="1"
          max="365"
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-1 max-w-xs">
        <label className="text-muted-foreground">Feedback window (months)</label>
        <input
          type="number"
          name="feedbackMonths"
          value={formData.feedbackMonths}
          onChange={(e) => handleInputChange("feedbackMonths", Number(e.target.value))}
          className="rounded border px-2 py-1"
          min="1"
          max="24"
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="anonymousAllowed"
          type="checkbox"
          name="anonymousAllowed"
          checked={formData.anonymousAllowed}
          onChange={(e) => handleInputChange("anonymousAllowed", e.target.checked)}
          className="rounded border"
          disabled={isLoading}
        />
        <label htmlFor="anonymousAllowed" className="text-sm">Allow anonymous reports</label>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="slaEnabled"
          type="checkbox"
          name="slaEnabled"
          checked={formData.slaEnabled}
          onChange={(e) => handleInputChange("slaEnabled", e.target.checked)}
          className="rounded border"
          disabled={isLoading}
        />
        <label htmlFor="slaEnabled" className="text-sm">Enable SLA tracking</label>
      </div>

      <div>
        <Button
          type="submit"
          className="px-3 py-2 text-sm"
          variant="primary"
          size="sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </form>
  )
}
