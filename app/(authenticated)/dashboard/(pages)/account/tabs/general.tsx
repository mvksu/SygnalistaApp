"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useAuth, useOrganization, useUser } from "@clerk/nextjs"
import { Button } from "tweakcn/ui/button"

type Role = "ADMIN" | "HANDLER" | "AUDITOR"

export function GeneralTab() {
  const { isLoaded, userId } = useAuth()
  const { organization } = useOrganization()
  const [dbRole, setDbRole] = useState<Role | null>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [language, setLanguage] = useState("en-US")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const user = useUser()

  useEffect(() => {
    if (!isLoaded || !organization) return
    let aborted = false
    ;(async () => {
      try {
        const res = await fetch("/api/auth/role", { cache: "no-store" })
        const data = (await res.json()) as { role: Role | null }
        if (!aborted) setDbRole(data.role)
      } catch {
        if (!aborted) setDbRole(null)
      }
    })()
    return () => { aborted = true }
  }, [isLoaded, organization])

  // hydrate with current user profile data
  useEffect(() => {
    let aborted = false
    ;(async () => {
      try {
        const res = await fetch("/api/account/profile", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (aborted) return
        setFirstName(data.firstName || "")
        setLastName(data.lastName || "")
        setLanguage(data.language || "en-US")
        setPhone(data.phone || "")
      } catch {}
    })()
    return () => { aborted = true }
  }, [])

  async function onSave() {
    setSaving(true)
    try {
      await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ firstName, lastName, language })
      })
    } finally {
      setSaving(false)
    }
  }

  if (!user.isLoaded || !user.user) return null

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Avatar</label>
          <div className="mt-2 flex items-center gap-3">
            <div className="bg-muted h-16 w-16 overflow-hidden rounded-full">
              {user.user.imageUrl ? (
                <Image
                  src={user.user.imageUrl}
                  alt="avatar"
                  width={64}
                  height={64}
                  className="h-16 w-16 object-cover"
                />
              ) : (
                <div className="h-16 w-16" />
              )}
            </div>
            <Button className="px-3 py-1 text-sm" disabled variant="outline" size="sm">
              Change
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">First name</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="John"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Last name</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Doe"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Phone</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+1 555 123 4567"
            disabled
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Language</label>
          <select
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={language}
            onChange={e => setLanguage(e.target.value)}
          >
            <option value="en-US">English (US)</option>
            <option value="pl-PL">Polski</option>
          </select>
        </div>
        <div>
          <Button
            className="px-3 py-2 text-sm"
            onClick={onSave}
            disabled={saving}
            variant="primary"
            size="sm"
          >
            Save changes
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Role</label>
          <input
            className="bg-muted mt-1 w-full rounded border px-3 py-2 text-sm"
            value={dbRole ?? ""}
            disabled
            readOnly
          />
          <p className="text-muted-foreground mt-1 text-xs">
            Roles are managed by your organization admin.
          </p>
        </div>
      </div>
    </div>
  )
}


