"use client"

import { ReportLog } from "@/db/schema/reportLogs"

export const CaseLogs = ({ logs }: { logs: ReportLog[] }) => {
  if (logs.length === 0) {
    return <div>No logs found</div>
  }

  return (
    <div>
      <div className="space-y-4">
        {logs.map(log => (
          <div
            key={log.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {log.message}
              </h2>
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-400">
                  {log.createdAt
                    ? new Date(log.createdAt).toLocaleString()
                    : ""}
                </span>
                <span className="text-xs text-gray-400">
                  {log.orgMemberId ? "User" : "System"}
                </span>
              </div>
            </div>
            <p className="text-gray-600">{log.type}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
