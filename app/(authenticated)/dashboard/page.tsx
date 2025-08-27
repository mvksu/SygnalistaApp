import { auth, currentUser } from "@clerk/nextjs/server"
import { getStatistics } from "@/src/server/services/stats"
// Removed broken import
import { Palette, Shield, UserPlus, Play, Lock, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import React from "react"
import { db } from "@/db"
import { users } from "@/db/schema/users"
import { and, eq, inArray } from "drizzle-orm"
import LinkNext from "next/link"
import { OnboardingActions } from "./_components/onboarding-actions"
import { OnboardingProgress } from "./_components/onboarding-progress"
import { CaseTable } from "@/components/cases/case-table"
import { reports } from "@/db/schema/reports"
import { reportCategories } from "@/db/schema/reportCategories"
import { reportAssignees } from "@/db/schema/reportAssignees"
import { orgMembers } from "@/db/schema/orgMembers"
import { listAssignedCaseRows } from "@/src/server/services/cases"
import { getActorOrgMemberId } from "@/actions/orgMembers"
import { DataTable } from "./_components/data-table"
import type { DataTableRow } from "./_components/data-table"
import { ChartPieDonut } from "./_components/chart-pie-donut"
import { ChartBarMixed } from "./_components/chart-bar-mixed"
import { SectionCards } from "./_components/section-cards"
import { ChartAreaInteractive } from "./_components/chart-area-interactive"


async function getOrCreateUserId() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null
  const existing = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (existing) return existing.id
  const user = await currentUser()
  const [row] = await db.insert(users).values({ clerkId, email: user?.emailAddresses?.[0]?.emailAddress || "", name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() }).returning()
  return row.id
}

export default async function Page() {
  const { orgId: clerkOrgId } = await auth()
  let stats = { newCases: 0, openCases: 0, closedCases: 0 }
  let dbOrgId: string | null = null
  if (clerkOrgId) {
    const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
    dbOrgId = await getDbOrgIdForClerkOrg(clerkOrgId)
    if (dbOrgId) {
      // Compute simple counts for dashboard boxes
      const all = await db
        .select({ createdAt: reports.createdAt, status: reports.status })
        .from(reports)
        .where(eq(reports.orgId, dbOrgId))
      const now = new Date()
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(now.getDate() - 7)
      let newCases = 0
      let openCases = 0
      let closedCases = 0
      for (const r of all) {
        if ((r.createdAt as Date) >= sevenDaysAgo) newCases++
        if ((r.status as string) === "CLOSED") closedCases++
        else openCases++
      }
      stats = { newCases, openCases, closedCases }
    }
  }
  const dbUserId = await getOrCreateUserId()
  const user = await currentUser()
  // Build "Assigned to me" rows using reusable service
  let assignedToMe: Awaited<ReturnType<typeof listAssignedCaseRows>> = []
  if (dbOrgId && dbUserId) {
    const memberId = await getActorOrgMemberId({ userId: dbUserId, orgId: dbOrgId })
    if (memberId) {
      assignedToMe = await listAssignedCaseRows(dbOrgId, memberId)
    }
  }

  
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {user?.firstName}
          </h1>
          <p className="text-muted-foreground mt-2">
            Here’s what to do to get started.
          </p>
        </div>
        <OnboardingProgress />
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {[
          {
            title: "Watch intro",
            icon: Play,
            description: "Learn how to use the platform effectively",
            action: async () => {
              "use server"
              // mark completed
              if (!dbUserId) return
              const { setStepCompleted } = await import(
                "@/src/server/services/onboarding"
              )
              await setStepCompleted(dbUserId, "watch_intro")
            },
            key: "watch_intro"
          },
          {
            title: "Invite members",
            icon: UserPlus,
            description: "Add team members to collaborate",
            href: "/dashboard/members",
            action: async () => {
              "use server"
              // mark completed
              if (!dbUserId) return
              const { setStepCompleted } = await import(
                "@/src/server/services/onboarding"
              )
              await setStepCompleted(dbUserId, "invite_members")
            },
            key: "invite_members"
          },
          {
            title: "Configure access",
            icon: Shield,
            description: "Set up roles and permissions",
            href: "/dashboard/access",
            action: async () => {
              "use server"
              // mark completed
              if (!dbUserId) return
              const { setStepCompleted } = await import(
                "@/src/server/services/onboarding"
              )
              await setStepCompleted(dbUserId, "configure_access")
            },
            key: "configure_access"
          },
          {
            title: "Brand reporting page",
            icon: Palette,
            description: "Customize the look and feel",
            href: "/dashboard/settings",
            action: async () => {
              "use server"
              // mark completed
              if (!dbUserId) return
              const { setStepCompleted } = await import(
                "@/src/server/services/onboarding"
              )
              await setStepCompleted(dbUserId, "brand_reporting")
            },
            key: "brand_reporting"
          },
          {
            title: "Set security defaults",
            icon: Lock,
            description: "Configure security settings",
            href: "/dashboard/settings",
            action: async () => {
              "use server"
              // mark completed
              if (!dbUserId) return
              const { setStepCompleted } = await import(
                "@/src/server/services/onboarding"
              )
              await setStepCompleted(dbUserId, "set_security_defaults")
            },
            key: "set_security_defaults"
          }
        ].map(
          (
            cfg: {
              title: string
              icon: React.ComponentType
              description?: string
              href?: string
              key: string
            },
            idx: number
          ) => (
            <div className="rounded-md border p-6 text-center" key={idx}>
              <div className="bg-muted mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full">
                {React.createElement(cfg.icon)}
              </div>
              <div className="text-lg font-semibold">{cfg.title}</div>
              <p className="text-muted-foreground mt-1 text-sm">
                {cfg.description}
              </p>
              <OnboardingActions
                title={cfg.title}
                description={cfg.description}
                href={cfg.href}
                keyName={cfg.key}
              />
            </div>
          )
        )}
      </div>
      <div className="flex flex-col gap-4">
        <SectionCards />
      </div>
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border p-4">
          <div className="text-muted-foreground text-xs uppercase">
            New cases (7d)
          </div>
          <div className="mt-1 text-2xl font-semibold">{stats.newCases}</div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-muted-foreground text-xs uppercase">
            Open cases
          </div>
          <div className="mt-1 text-2xl font-semibold">{stats.openCases}</div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-muted-foreground text-xs uppercase">
            Closed cases
          </div>
          <div className="mt-1 text-2xl font-semibold">{stats.closedCases}</div>
        </div>
      </div>

      <div className="mb-4 rounded-md border p-4">
        <div className="my-6">
          <DataTable data={assignedToMe as unknown as DataTableRow[]} />
        </div>
        <div className="flex gap-4 px-4 lg:px-6">
          <div className="basis-1/2">
            <ChartPieDonut />
          </div>
          <div className="basis-1/2">
            <ChartBarMixed />
          </div>
        </div>
      </div>
    </div>
  )
}
