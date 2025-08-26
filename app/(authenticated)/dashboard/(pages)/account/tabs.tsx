"use client"

import { useState } from "react"
import { GeneralTab } from "./tabs/general"
import { SecurityTab } from "./tabs/security"
import { NotificationsTab } from "./tabs/notifications"

export default function AccountTabs() {
  const [tab, setTab] = useState<"general" | "security" | "notifications">("general")
  return (
    <div className="rounded border">
      <div className="flex items-center gap-4 border-b px-4 pt-2">
        <button className={`px-3 py-2 text-sm ${tab === "general" ? "border-primary border-b-2 font-medium" : "text-muted-foreground"}`} onClick={() => setTab("general")}>General</button>
        <button className={`px-3 py-2 text-sm ${tab === "security" ? "border-primary border-b-2 font-medium" : "text-muted-foreground"}`} onClick={() => setTab("security")}>Security</button>
        <button className={`px-3 py-2 text-sm ${tab === "notifications" ? "border-primary border-b-2 font-medium" : "text-muted-foreground"}`} onClick={() => setTab("notifications")}>Notifications</button>
      </div>
      <div className="p-4">
        {tab === "general" && <GeneralTab />}
        {tab === "security" && <SecurityTab />}
        {tab === "notifications" && <NotificationsTab />}
      </div>
    </div>
  )
}


