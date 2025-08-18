"use client"

import { useMemo, useState } from "react"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts"

type Props = {
  kpis: any
  volume: any
  lifecycle: any
  categoryRisk: any
}

function aggregateStack(rows: Array<{ month: string; category: string; count: number }>) {
  const map = new Map<string, Record<string, any>>()
  for (const r of rows) {
    const obj = map.get(r.month) || { month: r.month }
    obj[r.category] = (obj[r.category] || 0) + r.count
    map.set(r.month, obj)
  }
  return Array.from(map.values()).sort((a, b) => (a.month < b.month ? -1 : 1))
}

function groupBy<T extends Record<string, any>>(rows: T[], key: keyof T) {
  const map = new Map<string, T[]>()
  for (const r of rows) {
    const k = String(r[key])
    const arr = map.get(k) || []
    arr.push(r)
    map.set(k, arr)
  }
  return Array.from(map.entries())
}

export default function ChartsClient({ kpis, volume, lifecycle, categoryRisk }: Props) {
  const [hoverCategory, setHoverCategory] = useState<string | null>(null)

  // Cross-highlight filter based on hoverCategory
  const filteredByMonth = useMemo(() => {
    if (!hoverCategory) return volume.byMonthCategory
    return volume.byMonthCategory.filter((d: any) => d.category === hoverCategory)
  }, [hoverCategory, volume.byMonthCategory])

  const topCats = useMemo(() => volume.pareto.map((p: any) => p.category).slice(0, 12), [volume.pareto])

  return (
    <div className="space-y-3">
      {/* Filters (placeholder – implement real date/category filters later) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Hover a category to cross-highlight</span>
      </div>

      {/* Cases by month (stack by category) */}
      <div className="rounded border p-3">
        <div className="mb-2 text-sm font-medium">Cases by month (stacked by category)</div>
        <div className="flex flex-wrap gap-2 text-xs">
          {topCats.map((c: string) => (
            <button
              key={c}
              onMouseEnter={() => setHoverCategory(c)}
              onMouseLeave={() => setHoverCategory(null)}
              className={`rounded border px-2 py-1 ${hoverCategory === c ? "bg-primary text-white" : "bg-background"}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={aggregateStack(filteredByMonth)} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              {topCats.map((c: string) => (
                <Bar key={c} dataKey={c} stackId="a" fill="#8884d8" hide={hoverCategory ? c !== hoverCategory : false} />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Seasonality heatmap (month × weekday) */}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded border p-3">
          <div className="mb-2 text-sm font-medium">Seasonality heatmap (month × weekday)</div>
          <pre className="max-h-64 overflow-auto text-xs">{JSON.stringify(volume.seasonality.slice(0, 100), null, 2)}</pre>
        </div>
        <div className="rounded border p-3">
          <div className="mb-2 text-sm font-medium">Rolling 28-day new cases (7-day MA)</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volume.rolling28} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#82ca9d" dot={false} />
                <Line type="monotone" dataKey="ma7" stroke="#8884d8" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pareto */}
      <div className="rounded border p-3">
        <div className="mb-2 text-sm font-medium">Pareto (categories sorted by volume; 80/20)</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={volume.pareto} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" interval={0} angle={-30} textAnchor="end" height={70} />
              <YAxis yAxisId="left" allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="count" fill="#82ca9d" />
              <Line yAxisId="right" type="monotone" dataKey="cumulativePct" stroke="#8884d8" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lifecycle */}
      <div className="rounded border p-3">
        <div className="mb-2 text-sm font-medium">Funnel</div>
        <pre className="max-h-64 overflow-auto text-xs">{JSON.stringify(lifecycle.funnel, null, 2)}</pre>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded border p-3">
          <div className="mb-2 text-sm font-medium">Ack cycle p50/p75/p95 (days)</div>
          <div className="text-xs">{lifecycle.ackCyclePercentilesDays.p50}/{lifecycle.ackCyclePercentilesDays.p75}/{lifecycle.ackCyclePercentilesDays.p95}</div>
        </div>
        <div className="rounded border p-3">
          <div className="mb-2 text-sm font-medium">First response p50/p75/p95 (days)</div>
          <div className="text-xs">{lifecycle.firstResponsePercentilesDays.p50}/{lifecycle.firstResponsePercentilesDays.p75}/{lifecycle.firstResponsePercentilesDays.p95}</div>
        </div>
        <div className="rounded border p-3">
          <div className="mb-2 text-sm font-medium">Aging WIP</div>
          <pre className="max-h-64 overflow-auto text-xs">{JSON.stringify(lifecycle.agingBuckets, null, 2)}</pre>
        </div>
      </div>
      <div className="rounded border p-3">
        <div className="mb-2 text-sm font-medium">Control/run chart (median ack time by week)</div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lifecycle.controlMedianAckByWeek} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="medianDays" stroke="#8884d8" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category risk */}
      <div className="rounded border p-3">
        <div className="mb-2 text-sm font-medium">Small multiples (per-category trend)</div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {groupBy(categoryRisk.smallMultiples, "category").map(([cat, data]) => (
            <div key={cat} className="h-40 rounded border p-2">
              <div className="text-xs mb-1">{cat}</div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data as any[]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" hide />
                  <YAxis hide />
                  <Area type="monotone" dataKey="count" stroke="#82ca9d" fill="#82ca9d33" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


