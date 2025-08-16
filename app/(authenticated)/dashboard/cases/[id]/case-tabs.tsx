"use client"

import { useState } from "react"
import dynamic from "next/dynamic"

type ThreadItem = { id: string; sender: "REPORTER" | "HANDLER"; body: string; createdAt: string }

const CaseThreadClient = dynamic(() => import("./client-thread"), { ssr: false }) as unknown as (
  props: { reportId: string; initialThread: ThreadItem[] }
) => JSX.Element

export default function CaseTabs({ reportId, initialThread }: { reportId: string; initialThread: ThreadItem[] }) {
  const [tab, setTab] = useState<"messages" | "logs">("messages")
  return (
    <div className="rounded border">
      <div className="flex items-center gap-4 border-b px-4 pt-2">
        <button
          className={`px-3 py-2 text-sm font-medium ${tab === "messages" ? "border-b-2 border-primary" : "text-muted-foreground"}`}
          onClick={() => setTab("messages")}
        >
          Messages
        </button>
        <button
          className={`px-3 py-2 text-sm ${tab === "logs" ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}
          onClick={() => setTab("logs")}
        >
          Logs
        </button>
      </div>
      <div className="p-4">
        {tab === "messages" ? (
          <CaseThreadClient reportId={reportId} initialThread={initialThread} />
        ) : (
          <div className="text-sm text-muted-foreground">Activity log coming soon.</div>
        )}
      </div>
    </div>
  )
}


