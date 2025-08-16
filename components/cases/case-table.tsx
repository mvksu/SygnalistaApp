"use client"

import { useMemo } from "react"
import Link from "next/link"

type CaseRow = {
  id: string
  caseId: string
  categoryName: string
  status: string
  createdAt: string | Date
  acknowledgedAt: string | Date | null
  feedbackDueAt: string | Date | null
  ackDueAt: string | Date
  ackStatus: "due" | "overdue" | "done"
  feedbackStatus: "due" | "overdue" | "done"
}

export function CaseTable({ rows }: { rows: CaseRow[] }) {
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
            <th className="text-left p-2">Category</th>
            <th className="text-left p-2">Created</th>
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
              <td className="p-2">{r.categoryName}</td>
              <td className="p-2">{format(r.createdAt)}</td>
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


