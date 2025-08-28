"use client"

import { ReportLog } from "@/db/schema/reportLogs"
import { CalendarClock, Tag, UserRound, AlertTriangle, CheckCircle2, MessageSquare, Users } from "lucide-react"

type EnrichedLog = ReportLog & { userName?: string | null }

function iconFor(type: string) {
  switch (type) {
    case "assignment_added":
    case "assignee_added":
      return Users
    case "priority_changed":
      return AlertTriangle
    case "status_changed":
      return CheckCircle2
    case "label_added":
    case "label_removed":
      return Tag
    case "comment":
      return MessageSquare
    default:
      return CalendarClock
  }
}

function timeAgo(date?: Date | string | null) {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export const CaseLogs = ({ logs }: { logs: EnrichedLog[] }) => {
  if (logs.length === 0) {
    return <div>No logs found</div>
  }

  return (
    <div className="space-y-3">
      {logs.map(log => {
        const Icon = iconFor(log.type)
        const actor = log.userName || (log.orgMemberId ? "User" : "System")
        return (
          <div key={log.id} className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-muted p-1">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{actor}</span>
                <span className="text-muted-foreground">{log.message}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {timeAgo(log.createdAt as any)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
