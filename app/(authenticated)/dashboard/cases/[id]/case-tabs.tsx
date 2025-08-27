"use client"

import dynamic from "next/dynamic"
import { CaseLogs } from "./case-logs"
import { ReportLog } from "@/db/schema/reportLogs"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

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
  return (
    <Card>
      <Tabs defaultValue="messages">
        <TabsList className="grid w-full grid-cols-3 border-b bg-transparent">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="internal">Internal notes</TabsTrigger>
        </TabsList>
        <CardContent className="p-4">
          <TabsContent value="messages">
            <CaseThreadClient reportId={reportId} initialThread={initialThread} />
          </TabsContent>
          <TabsContent value="logs">
            <CaseLogs logs={initialLogs} />
          </TabsContent>
          <TabsContent value="internal">
            <div className="text-sm text-muted-foreground">
              Internal notes coming soon.
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}

