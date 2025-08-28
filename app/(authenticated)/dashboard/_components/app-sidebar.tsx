"use client"

import { LayoutDashboard, CaseSensitive, BarChart2, Building2, Users, ShieldCheck, FolderTree, Radio, ClipboardList, Settings, ListTree } from "lucide-react"
import * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from "@/components/ui/sidebar"
import { OrganizationSwitcher } from "@clerk/nextjs"
import { NavMain } from "../_components/nav-main"
import { NavUser } from "../_components/nav-user"

export function AppSidebar({
  userData,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  userData: {
    name: string
    email: string
    avatar: string
    membership: string
  }
}) {
  const data = {
    user: userData,
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        items: []
      },
      {
        title: "Cases",
        url: "/dashboard/cases",
        icon: CaseSensitive,
        items: []
      },
      {
        title: "Statistics",
        url: "/dashboard/statistics",
        icon: BarChart2,
        items: []
      },
      {
        title: "Departments",
        url: "/dashboard/departments",
        icon: Building2,
        items: []
      },
      {
        title: "Members",
        url: "/dashboard/members",
        icon: Users,
        items: []
      },
      {
        title: "Access Configuration",
        url: "/dashboard/access",
        icon: ShieldCheck,
        items: []
      },
      {
        title: "Categoring",
        url: "/dashboard/categories",
        icon: FolderTree,
        items: []
      },
      {
        title: "Reporting Channels",
        url: "/dashboard/reporting-channels",
        icon: Radio,
        items: []
      },
      {
        title: "Surveys",
        url: "/dashboard/surveys",
        icon: ClipboardList,
        items: []
      },
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
        items: []
      }
      ,{
        title: "Audit",
        url: "/dashboard/audit",
        icon: ListTree,
        items: []
      }
    ]
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrganizationSwitcher
          hidePersonal
          afterCreateOrganizationUrl="/dashboard"
          afterLeaveOrganizationUrl="/"
          appearance={{
            elements: {
              organizationSwitcherTrigger: "w-full justify-start",
              organizationPreviewTextContainer: "truncate",
              organizationSwitcherTriggerIcon: "ml-auto"
            }
          }}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
