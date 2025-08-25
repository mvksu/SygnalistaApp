"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

async function createMember(input: { firstName: string; lastName: string; email: string; role: "ADMIN" | "HANDLER" | "AUDITOR" }) {
  const res = await fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) })
  let data: any = null
  try {
    data = await res.json()
  } catch {}
  if (!res.ok) {
    const msg = data?.error || data?.message || `${res.status} ${res.statusText}`
    throw new Error(msg)
  }
  return { status: res.status, data }
}

export default function NewMemberButton() {
  const [open, setOpen] = useState(false)
  const [firstName, setFirst] = useState("")
  const [lastName, setLast] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"ADMIN" | "HANDLER" | "AUDITOR">("HANDLER")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const disabled = saving || !email.trim()

  async function submit() {
    setSaving(true)
    try {
      setError("")
      setSuccess("")
      const res = await createMember({ firstName, lastName, email, role })
      if (res.status === 202 && res.data?.invited) {
        setSuccess("Invitation sent. The user will appear after acceptance.")
      } else {
        window.location.reload()
      }
    } catch (e: any) {
      setError(e?.message || "Failed to create member")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>New member</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="bg-card relative z-10 w-[90vw] max-w-lg rounded-md p-4 shadow-xl">
            <div className="text-base font-semibold">Invite new member</div>
            <div className="mt-4 grid gap-3">
              {error ? (
                <div className="text-destructive bg-destructive/10 rounded-md p-2 text-sm" role="alert">{error}</div>
              ) : null}
              {success ? (
                <div className="text-emerald-600 bg-emerald-600/10 rounded-md p-2 text-sm">{success}</div>
              ) : null}
              <Field label="First name">
                <Input value={firstName} onChange={e => setFirst(e.target.value)} />
              </Field>
              <Field label="Last name">
                <Input value={lastName} onChange={e => setLast(e.target.value)} />
              </Field>
              <Field label="Email">
                <Input type="email" value={email} onChange={e => { setEmail(e.target.value); setError("") }} />
              </Field>
              <Field label="Permission">
                <select className="w-full rounded-md border px-2 py-2" value={role} onChange={e => { setRole(e.target.value as any); setError("") }}>
                  <option value="ADMIN">Admin</option>
                  <option value="HANDLER">Handler</option>
                  <option value="AUDITOR">Auditor</option>
                </select>
              </Field>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Back
                </Button>
                <Button onClick={submit} disabled={disabled}>
                  {saving ? "Inviting..." : "Invite"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-muted-foreground text-xs font-medium">{label}</div>
      {children}
    </div>
  )
}


