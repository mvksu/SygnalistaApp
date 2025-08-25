"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { CaseLogs } from "./case-logs"
import { ReportLog } from "@/db/schema/reportLogs"

type ThreadItem = {
  id: string
  sender: "REPORTER" | "HANDLER"
  body: string
  createdAt: string
}

const CaseThreadClient = dynamic(() => import("./client-thread"), {
  ssr: false
}) as unknown as (props: {
  reportId: string
  initialThread: ThreadItem[]
}) => JSX.Element

export default function CaseTabs({
  reportId,
  initialThread,
  initialLogs
}: {
  reportId: string
  initialThread: ThreadItem[]
  initialLogs: ReportLog[]
}) {
  const [tab, setTab] = useState<"messages" | "logs" | "internal">("messages")
  return (
    <div className="rounded border">
      <div className="flex items-center gap-4 border-b px-4 pt-2">
        <button
          className={`px-3 py-2 text-sm font-medium ${tab === "messages" ? "border-primary border-b-2" : "text-muted-foreground"}`}
          onClick={() => setTab("messages")}
        >
          Messages
        </button>
        <button
          className={`px-3 py-2 text-sm ${tab === "logs" ? "border-primary border-b-2 font-medium" : "text-muted-foreground"}`}
          onClick={() => setTab("logs")}
        >
          Logs
        </button>
        <button
          className={`px-3 py-2 text-sm ${tab === "internal" ? "border-primary border-b-2 font-medium" : "text-muted-foreground"}`}
          onClick={() => setTab("internal")}
        >
          Internal notes
        </button>
      </div>
      <div className="p-4">
        {tab === "messages" && (
          <CaseThreadClient reportId={reportId} initialThread={initialThread} />
        )}
        {tab === "logs" && <CaseLogs logs={initialLogs} />}
        {tab === "internal" && (
          <div className="text-muted-foreground text-sm">
            Internal notes coming soon.
          </div>
        )}
      </div>
    </div>
  )
}
