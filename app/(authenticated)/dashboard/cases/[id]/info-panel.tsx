"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import type { SelectReport } from "@/db/schema/reports"
import { Avatar } from "@/components/ui/avatar"
import { AvatarFallback } from "@radix-ui/react-avatar"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"

type ReportStatus =
  | "NEW"
  | "OPEN"
  | "CLOSED"

function toLocal(d: Date | string | null | undefined) {
  if (!d) return "—"
  const date = typeof d === "string" ? new Date(d) : d
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString()
}

export default function InfoPanel({
  report,
  orgName,
  lastViewedByReporter,
  reporterContact
}: {
  report: SelectReport
  orgName: string
  lastViewedByReporter: Date | string | null
  reporterContact?: { email?: string; phone?: string }
}) {
  // 2) Local state for optimistic UI (fall back to a valid default if status is missing)
  const initialStatus = (report.status as ReportStatus | undefined) ?? "NEW"
  const [status, setStatus] = useState<ReportStatus>(initialStatus)
  const [isPending, startTransition] = useTransition()

  const [assignees, setAssignees] = useState<string[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [members, setMembers] = useState<
    Array<{ orgMemberId: string; name: string; email: string }>
  >([])
  const [query, setQuery] = useState("")

  useEffect(() => {
    // fetch current assignees
    ;(async () => {
      try {
        const r = await fetch(`/api/reports/${report.id}/assignees`, {
          cache: "no-store"
        })
        if (r.ok) {
          const j = await r.json()
          setAssignees(Array.isArray(j.assignees) ? j.assignees : [])
        }
      } catch {}
    })()
  }, [report.id])

  useEffect(() => {
    if (!showPicker) return
    ;(async () => {
      try {
        const r = await fetch(`/api/members`, { cache: "no-store" })
        if (r.ok) {
          const list: Array<{
            orgMemberId: string
            name: string
            email: string
          }> = await r.json()
          setMembers(list)
        }
      } catch {}
    })()
  }, [showPicker])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return members
    return members.filter(
      m =>
        (m.name || "").toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q)
    )
  }, [members, query])

  async function assign(memberId: string) {
    try {
      const r = await fetch(`/api/reports/${report.id}/assignees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add: [memberId] })
      })
      if (r.ok) {
        const j = await r.json()
        setAssignees(j.assignees || [])
        setShowPicker(false)
      }
    } catch {}
  }

  const info = useMemo(
    () =>
      [
        { label: "Status", value: status },
        { label: "Submitted", value: toLocal(report.createdAt as any) },
        {
          label: "Last update",
          value: toLocal((report as any).acknowledgedAt)
        },
        {
          label: "Last reporter view",
          value: toLocal(lastViewedByReporter)
        },
        ...(report.reporterMode === "IDENTIFIED"
          ? ([
              { label: "Reporter email", value: reporterContact?.email || "—" },
              { label: "Reporter phone", value: reporterContact?.phone || "—" }
            ] as Array<{ label: string; value: string }>)
          : []),
        {
          label: "Assignees",
          value: assignees.map(a => initials(a)).join(", ")
        },
        { label: "Organization name", value: orgName || "—" },
        { label: "Due date", value: toLocal(report.feedbackDueAt) || "—" },
        { label: "Reporter", value: report.reporterMode || "—" },
      ] as Array<{ label: string; value: string }>,
    [
      status,
      report.createdAt,
      (report as any).acknowledgedAt,
      lastViewedByReporter,
      orgName,
      assignees,
      reporterContact,
      report.reporterMode
    ]
  )

  async function updateStatus(next: ReportStatus) {
    // optimistic
    const prev = status
    setStatus(next)

    startTransition(async () => {
      try {
        const resp = await fetch(`/api/reports/${report.id}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next })
        })
        if (!resp.ok) {
          // rollback if server failed
          setStatus(prev)
          throw new Error(await resp.text())
        }
      } catch (err) {
        console.error(err)
        // optionally show a toast
      }
    })
  }
  // 1) Guard: if report is missing, render a safe placeholder
  if (!report) {
    return (
      <div className="rounded border p-4">
        <div className="mb-2 text-base font-semibold">Information</div>
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    )
  }
  function initials(name?: string | null) {
    if (!name) return "?"
    const parts = name.trim().split(/\s+/)
    const a = parts[0]?.[0] || ""
    const b = parts.length > 1 ? parts[parts.length - 1][0] : ""
    return (a + b).toUpperCase()
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="space-y-2 text-sm">
          {info.map(i => (
            <div key={i.label} className="flex items-center justify-between">
              <div className="text-muted-foreground">{i.label}</div>

              {i.label === "Status" ? (
                <select
                  className="rounded-md border p-1"
                  value={status}
                  onChange={e => updateStatus(e.target.value as ReportStatus)}
                  disabled={isPending}
                >
                  <option value="NEW">New</option>
                  <option value="OPEN">Open</option>
                  <option value="CLOSED">Closed</option>
                </select>
              ) : i.label === "Assignees" ? (
                <div className="flex items-center gap-2">
                  <div>{assignees.length ? `${assignees.length}` : "—"}</div>
                  <div>
                    <div className="flex -space-x-2">
                      {assignees.map((a, idx) => (
                        <Avatar
                          key={a}
                          className="h-6 w-6 border-2 border-white bg-amber-100 text-xs"
                          style={{ zIndex: assignees.length - idx }}
                        >
                          <AvatarFallback>{i.value}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                  <Button
                    className="h-6 w-6 text-xs"
                    title="Assign member"
                    onClick={() => setShowPicker(true)}
                    variant="outline"
                    size="icon"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>{i.value}</div>
              )}
            </div>
          ))}

          {isPending && (
            <div className="text-muted-foreground text-xs">Saving…</div>
          )}
        </div>
      </div>
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded bg-white p-4 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-base font-semibold">Assign member</div>
              <Button
                className="text-sm text-muted-foreground"
                onClick={() => setShowPicker(false)}
                variant="link"
                size="sm"
              >
                Close
              </Button>
            </div>
            <input
              className="mb-3 w-full rounded border px-2 py-1 text-sm"
              placeholder="Search by name or email"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <div className="max-h-64 overflow-auto">
              {filtered.map(m => (
                <Button
                  key={m.orgMemberId}
                  className="flex w-full items-center justify-between px-2 py-2 text-left hover:bg-muted/50"
                  onClick={() => assign(m.orgMemberId)}
                  variant="ghost"
                  size="sm"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {m.name || m.email}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {m.email}
                    </div>
                  </div>
                  <div className="text-xs">Assign</div>
                </Button>
              ))}
              {filtered.length === 0 && (
                <div className="text-muted-foreground py-6 text-center text-sm">
                  No members found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
