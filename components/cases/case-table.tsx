"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Avatar } from "../ui/avatar"
import { Button } from "../ui/button"
import { CaseListItem } from "@/src/server/services/cases"
import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet"
import { UserPlus } from "lucide-react"

type CaseRow = {
  id: string
  caseId: string
  subject?: string
  category: string
  assignees: { id: string; name: string }[]
  status: string
  createdAt: string | Date
  acknowledgedAt: string | Date | null
  feedbackDueAt: string | Date | null
  ackDueAt: string | Date
  ackStatus: "due" | "overdue" | "done"
  feedbackStatus: "due" | "overdue" | "done"
}

export function CaseTable({ rows }: { rows: CaseRow[]  }) {
  const format = useMemo(() => (d?: string | Date | null) => (d ? new Date(d).toLocaleDateString() : "—"), [])

  const chip = (state: "due" | "overdue" | "done") => {
    const map = {
      due: "bg-amber-100 text-amber-900",
      overdue: "bg-red-100 text-red-900",
      done: "bg-emerald-100 text-emerald-900",
    }
    return <span className={`px-2 py-1 rounded text-xs ${map[state]}`}>{state}</span>
  }

  return (
    <div className="overflow-x-auto border rounded-md">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="text-left p-2">Case ID</th>
            <th className="text-left p-2">Subject</th>
            <th className="text-left p-2">Category</th>
            <th className="text-left p-2">Assignees</th>
            <th className="text-left p-2">Created</th>
            <th className="text-left p-2">Last update</th>
            <th className="text-left p-2">Ack due</th>
            <th className="text-left p-2">Ack</th>
            <th className="text-left p-2">Feedback</th>
            <th className="text-left p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t hover:bg-muted/30">
              <td className="p-2 font-mono">
                <Link href={`/dashboard/cases/${r.id}`} className="text-primary hover:underline">
                  {r.caseId}
                </Link>
              </td>
              <td className="p-2 max-w-[240px] truncate" title={r.subject || "—"}>{r.subject || "—"}</td>
              <td className="p-2">{r.category}</td>
              <td className="p-2 relative">
                {r.assignees.length > 0 ? (
                  r.assignees.map(a => (
                    <Avatar key={a.id} className="w-4 h-4 text-xs bg-blue-100 inline-flex mr-1">
                      {a.name ? a.name.charAt(0) + a.name.charAt(a.name.length - 1) : "?"}
                    </Avatar>
                  ))
                ) : (
                  <AssignPopover reportId={r.id} />
                )}
              </td>
              <td className="p-2">{format(r.createdAt)}</td>
              <td className="p-2">{"-"}</td>
              <td className="p-2">{format(r.ackDueAt)}</td>
              <td className="p-2">{chip(r.ackStatus)}</td>
              <td className="p-2">{chip(r.feedbackStatus)}</td>
              <td className="p-2">{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AssignPopover({ reportId }: { reportId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [members, setMembers] = useState<Array<{ orgMemberId: string; name: string; email: string }>>([])
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    const fetchMembers = async () => {
      const res = await fetch("/api/members")
      const data = await res.json()
      setMembers(data || [])
    }
    fetchMembers()
  }, [open])

  const filtered = members.filter(m => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
  })

  const toggle = (id: string) => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  const confirm = async () => {
    if (selected.length === 0) return setOpen(false)
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/${reportId}/assignees`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ add: selected }),
      })
      if (!res.ok) throw new Error("Failed to assign")
      // simple refresh
      window.location.reload()
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="h-7 w-7 rounded-full p-0" aria-label="Assign">
          <UserPlus className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[380px] p-4">
        <SheetHeader>
          <SheetTitle>Assign handlers</SheetTitle>
        </SheetHeader>
        <div className="space-y-3 mt-4">
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Search name or email"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="max-h-[50vh] overflow-auto border rounded">
            {filtered.map(m => (
              <label key={m.orgMemberId} className="flex items-center gap-2 px-3 py-2 border-b last:border-b-0">
                <input type="checkbox" checked={selected.includes(m.orgMemberId)} onChange={() => toggle(m.orgMemberId)} />
                <div>
                  <div className="text-sm font-medium">{m.name || m.email}</div>
                  <div className="text-xs text-muted-foreground">{m.email}</div>
                </div>
              </label>
            ))}
            {filtered.length === 0 && (
              <div className="text-sm text-muted-foreground p-3">No matches</div>
            )}
          </div>
          <div className="flex gap-2">
            <Button className="w-full" disabled={loading || selected.length === 0} onClick={confirm}>Confirm</Button>
            <Button className="w-full" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}


