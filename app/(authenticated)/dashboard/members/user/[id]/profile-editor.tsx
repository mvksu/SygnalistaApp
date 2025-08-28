"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function MemberEditor({ id, name, email, role, phone, clerkId }: { id: string; name: string; email: string; role: "ADMIN" | "HANDLER" | "AUDITOR"; phone: string; clerkId: string }) {
  const [firstName, setFirst] = useState(name.split(" ")[0] || "")
  const [lastName, setLast] = useState(name.split(" ").slice(1).join(" ") || "")
  const [phoneNumber, setPhone] = useState(phone)
  const [memberRole, setMemberRole] = useState(role)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [ok, setOk] = useState("")

  async function saveProfile() {
    setSaving(true)
    setError("")
    setOk("")
    try {
      const res = await fetch(`/api/members/user/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName, lastName, phone: phoneNumber }) })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || `${res.status} ${res.statusText}`)
      setOk("Saved")
    } catch (e: any) {
      setError(e?.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  async function saveRole() {
    setSaving(true)
    setError("")
    setOk("")
    try {
      const res = await fetch(`/api/members/update`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role: memberRole }) })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || `${res.status} ${res.statusText}`)
      setOk("Role updated")
    } catch (e: any) {
      setError(e?.message || "Failed to update role")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6">
      {error ? <div className="text-destructive bg-destructive/10 rounded p-2 text-sm">{error}</div> : null}
      {ok ? <div className="text-emerald-600 bg-emerald-600/10 rounded p-2 text-sm">{ok}</div> : null}
      <section className="grid gap-3">
        <div className="text-sm font-medium">Profile</div>
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground mb-1">First name</div>
            <Input value={firstName} onChange={e => setFirst(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Last name</div>
            <Input value={lastName} onChange={e => setLast(e.target.value)} />
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Phone number</div>
          <Input value={phoneNumber} onChange={e => setPhone(e.target.value)} placeholder="+48 ..." />
        </div>
        <div className="flex gap-2">
          <Button onClick={saveProfile} disabled={saving}>Save profile</Button>
        </div>
      </section>

      <section className="grid gap-3">
        <div className="text-sm font-medium">Permissions</div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Role</div>
          <Select value={memberRole} onValueChange={value => setMemberRole(value as any)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Administrator</SelectItem>
              <SelectItem value="HANDLER">Handler</SelectItem>
              <SelectItem value="AUDITOR">Auditor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveRole} disabled={saving}>Update role</Button>
        </div>
      </section>
    </div>
  )
}



