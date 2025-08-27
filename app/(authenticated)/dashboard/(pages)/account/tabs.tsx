"use client"

import { useState } from "react"
import { GeneralTab } from "./tabs/general"
import { SecurityTab } from "./tabs/security"
import { NotificationsTab } from "./tabs/notifications"
import { Button } from "tweakcn/ui/button"

export default function AccountTabs() {
  const [tab, setTab] = useState<"general" | "security" | "notifications">("general")
  return (
    <div className="rounded border">
      <div className="flex items-center gap-4 border-b px-4 pt-2">
        <Button className={`px-3 py-2 text-sm ${tab === "general" ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`} onClick={() => setTab("general")} variant="link" size="sm">General</Button>
        <Button className={`px-3 py-2 text-sm ${tab === "security" ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`} onClick={() => setTab("security")} variant="link" size="sm">Security</Button>
        <Button className={`px-3 py-2 text-sm ${tab === "notifications" ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`} onClick={() => setTab("notifications")} variant="link" size="sm">Notifications</Button>
      </div>
      <div className="p-4">
        {tab === "general" && <GeneralTab />}
        {tab === "security" && <SecurityTab />}
        {tab === "notifications" && <NotificationsTab />}
      </div>
    </div>
  )
}


