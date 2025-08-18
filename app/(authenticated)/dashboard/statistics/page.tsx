import { auth } from "@clerk/nextjs/server"
import { getDbOrgIdForClerkOrg } from "@/src/server/orgs"
import { getStatistics } from "@/src/server/services/stats"
import ChartsClient from "./stats-client"

export default async function StatisticsPage() {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return null
  const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
  const stats = await getStatistics(orgId)

  const k = stats.kpis
  const vol = stats.volume
  const life = stats.lifecycle
  const cat = stats.categoryRisk

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Statistics</h1>

      {/* 1) Compliance-at-a-glance */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Acknowledged within 7 days" value={`${k.ackWithin7Pct}%`} sub={`${k.ackOverdueCount} overdue`} />
        <KpiCard title="Feedback within 3 months" value={`${k.feedbackWithin3moPct}%`} sub={`${k.feedbackOverdueCount} overdue`} />
        <KpiCard title=">90 days open (watchlist)" value={String(k.openOver90Count)} />
        <KpiCard title="Register completeness" value={`${k.registerCompletenessPct}%`} sub={`Anon: ${k.anonymousSharePct}% · 2-way: ${k.twoWayCommSuccessPct}%`} />
      </div>

      {/* 2) Volume & trend */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Volume & trend</h2>
        <ChartsClient
          kpis={k}
          volume={vol}
          lifecycle={life}
          categoryRisk={cat}
        />
      </section>

      {/* 3) Case lifecycle & speed */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Case lifecycle & speed</h2>
        <ChartContainer title="Funnel">
          <pre className="text-xs overflow-x-auto">{JSON.stringify(life.funnel, null, 2)}</pre>
        </ChartContainer>
        <div className="grid gap-3 lg:grid-cols-3">
          <KpiCard title="Ack cycle p50/p75/p95 (days)" value={`${life.ackCyclePercentilesDays.p50}/${life.ackCyclePercentilesDays.p75}/${life.ackCyclePercentilesDays.p95}`} />
          <KpiCard title="First response p50/p75/p95 (days)" value={`${life.firstResponsePercentilesDays.p50}/${life.firstResponsePercentilesDays.p75}/${life.firstResponsePercentilesDays.p95}`} />
          <ChartContainer title="Aging WIP">
            <pre className="text-xs overflow-x-auto">{JSON.stringify(life.agingBuckets, null, 2)}</pre>
          </ChartContainer>
        </div>
        <ChartContainer title="Control/run chart (median ack time by week)">
          <pre className="text-xs overflow-x-auto">{JSON.stringify(life.controlMedianAckByWeek.slice(0, 50), null, 2)}</pre>
        </ChartContainer>
      </section>

      {/* 4) Category, severity, risk */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Category & risk</h2>
        <ChartContainer title="Small multiples (per-category trend)">
          <pre className="text-xs overflow-x-auto">{JSON.stringify(cat.smallMultiples.slice(0, 50), null, 2)}</pre>
        </ChartContainer>
      </section>
    </div>
  )
}

function KpiCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded border p-4">
      <div className="text-xs uppercase text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {sub ? <div className="text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  )
}

function ChartContainer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border p-4">
      <div className="mb-2 text-sm font-medium">{title}</div>
      {children}
    </div>
  )
}


