import { db } from "@/db"
import { reports } from "@/db/schema/reports"
import { reportMessages } from "@/db/schema/reportMessages"
import { reportCategories } from "@/db/schema/reportCategories"
import { and, eq, gte, lte, inArray } from "drizzle-orm"

export type DashboardStats = {
  newCases: number
  openCases: number
  closedCases: number
}

export type ComplianceKpis = {
  ackWithin7Pct: number
  ackOverdueCount: number
  feedbackWithin3moPct: number
  feedbackOverdueCount: number
  openOver90Count: number
  registerCompletenessPct: number
  anonymousSharePct: number
  twoWayCommSuccessPct: number
}

export type VolumeTrend = {
  byMonthCategory: Array<{ month: string; category: string; count: number }>
  seasonality: Array<{ month: number; weekday: number; count: number }>
  rolling28: Array<{ date: string; count: number; ma7: number }>
  pareto: Array<{ category: string; count: number; cumulativePct: number }>
}

export type LifecycleSpeed = {
  funnel: Array<{ stage: string; count: number }>
  ackCyclePercentilesDays: { p50: number; p75: number; p95: number }
  firstResponsePercentilesDays: { p50: number; p75: number; p95: number }
  agingBuckets: Array<{ label: string; count: number }>
  controlMedianAckByWeek: Array<{ week: string; medianDays: number }>
}

export type CategoryRisk = {
  smallMultiples: Array<{ category: string; month: string; count: number }>
}

export type Statistics = {
  kpis: ComplianceKpis
  volume: VolumeTrend
  lifecycle: LifecycleSpeed
  categoryRisk: CategoryRisk
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function weekKey(d: Date): string {
  const x = new Date(d)
  const year = x.getUTCFullYear()
  const onejan = new Date(Date.UTC(year, 0, 1))
  const millis = x.getTime() - onejan.getTime()
  const day = Math.floor(millis / 86400000)
  const week = Math.ceil((day + onejan.getUTCDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, "0")}`
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * (sorted.length - 1))))
  return sorted[idx]
}

export async function getStatistics(
  orgId: string,
  opts?: { from?: Date; to?: Date; categories?: string[] }
): Promise<Statistics> {
  const now = new Date()
  const whereClauses: any[] = [eq(reports.orgId, orgId)]
  if (opts?.from) whereClauses.push(gte(reports.createdAt, opts.from))
  if (opts?.to) whereClauses.push(lte(reports.createdAt, opts.to))
  if (opts?.categories && opts.categories.length) whereClauses.push(inArray(reports.categoryId, opts.categories as any))

  const allReports = await db
    .select({
      id: reports.id,
      createdAt: reports.createdAt,
      acknowledgedAt: reports.acknowledgedAt,
      feedbackDueAt: reports.feedbackDueAt,
      status: reports.status,
      categoryId: reports.categoryId,
      reporterMode: reports.reporterMode,
    })
    .from(reports)
    .where(and(...whereClauses))

  const reportIds = allReports.map(r => r.id)
  const msgs = reportIds.length
    ? await db
        .select({ reportId: reportMessages.reportId, sender: reportMessages.sender, createdAt: reportMessages.createdAt })
        .from(reportMessages)
        .where(inArray(reportMessages.reportId, reportIds))
    : []

  const idToMsgs = new Map<string, { reporter: Date[]; handler: Date[] }>()
  for (const m of msgs) {
    const entry = idToMsgs.get(m.reportId) || { reporter: [], handler: [] }
    if (m.sender === "REPORTER") entry.reporter.push(m.createdAt as Date)
    if (m.sender === "HANDLER") entry.handler.push(m.createdAt as Date)
    idToMsgs.set(m.reportId, entry)
  }

  // KPIs
  const total = allReports.length || 1
  let ackWithin = 0
  let ackOverdue = 0
  let feedbackSuccess = 0
  let feedbackOverdue = 0
  let openOver90 = 0
  let anonymousCount = 0
  let twoWaySuccess = 0
  let completeCount = 0
  for (const r of allReports) {
    const created = r.createdAt as Date
    const ackDeadline = new Date(created)
    ackDeadline.setDate(ackDeadline.getDate() + 7)
    if (r.acknowledgedAt && (r.acknowledgedAt as Date) <= ackDeadline) ackWithin++
    if (!r.acknowledgedAt && ackDeadline < now) ackOverdue++
    if ((r.status as string) === "FEEDBACK_GIVEN") feedbackSuccess++
    if (r.feedbackDueAt && (r.feedbackDueAt as Date) < now && (r.status as string) !== "FEEDBACK_GIVEN") feedbackOverdue++
    const ageDays = Math.floor((now.getTime() - created.getTime()) / 86400000)
    if ((r.status as string) !== "CLOSED" && ageDays > 90) openOver90++
    if ((r.reporterMode as string) === "ANON") anonymousCount++
    const m = idToMsgs.get(r.id)
    if (m && m.reporter.length > 0 && m.handler.length > 0) twoWaySuccess++
    // completeness heuristic: has category, has at least one message
    if (r.categoryId && m && (m.reporter.length + m.handler.length) > 0) completeCount++
  }

  const kpis: ComplianceKpis = {
    ackWithin7Pct: Math.round((ackWithin / total) * 100),
    ackOverdueCount: ackOverdue,
    feedbackWithin3moPct: Math.round((feedbackSuccess / total) * 100),
    feedbackOverdueCount: feedbackOverdue,
    openOver90Count: openOver90,
    registerCompletenessPct: Math.round((completeCount / total) * 100),
    anonymousSharePct: Math.round((anonymousCount / total) * 100),
    twoWayCommSuccessPct: Math.round((twoWaySuccess / total) * 100),
  }

  // Volume & trend
  // Cases by Month stacked by category
  const catMap = new Map<string, string>()
  if (allReports.length) {
    const cats = await db
      .select({ id: reportCategories.id, name: reportCategories.name })
      .from(reportCategories)
      .where(inArray(reportCategories.id, Array.from(new Set(allReports.map(r => r.categoryId)) as any)))
    for (const c of cats) catMap.set(c.id, c.name)
  }
  const byMonthCategoryMap = new Map<string, number>()
  for (const r of allReports) {
    const month = new Date(r.createdAt as Date)
    const keyMonth = `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, "0")}`
    const catName = catMap.get(r.categoryId) || "Uncategorized"
    const key = `${keyMonth}__${catName}`
    byMonthCategoryMap.set(key, (byMonthCategoryMap.get(key) || 0) + 1)
  }
  const byMonthCategory = Array.from(byMonthCategoryMap.entries()).map(([k, v]) => {
    const [month, category] = k.split("__")
    return { month, category, count: v }
  })

  // Seasonality (month x weekday)
  const seasonalityMap = new Map<string, number>()
  for (const r of allReports) {
    const d = new Date(r.createdAt as Date)
    const key = `${d.getUTCMonth() + 1}-${d.getUTCDay()}`
    seasonalityMap.set(key, (seasonalityMap.get(key) || 0) + 1)
  }
  const seasonality = Array.from(seasonalityMap.entries()).map(([k, v]) => {
    const [m, w] = k.split("-")
    return { month: Number(m), weekday: Number(w), count: v }
  })

  // Rolling 28 days with 7-day MA
  const days = 28
  const dailyCounts: Array<{ date: string; count: number }> = []
  for (let i = days - 1; i >= 0; i--) {
    const d0 = new Date(now)
    d0.setDate(now.getDate() - i)
    const d1 = new Date(d0)
    d1.setDate(d0.getDate() + 1)
    const cnt = allReports.filter(r => (r.createdAt as Date) >= d0 && (r.createdAt as Date) < d1).length
    dailyCounts.push({ date: d0.toISOString().slice(0, 10), count: cnt })
  }
  const rolling28 = dailyCounts.map((row, idx) => {
    const from = Math.max(0, idx - 6)
    const slice = dailyCounts.slice(from, idx + 1)
    const ma7 = slice.reduce((a, b) => a + b.count, 0) / slice.length
    return { date: row.date, count: row.count, ma7: Math.round(ma7 * 100) / 100 }
  })

  // Pareto by category (all time)
  const perCatMap = new Map<string, number>()
  for (const r of allReports) {
    const cat = catMap.get(r.categoryId) || "Uncategorized"
    perCatMap.set(cat, (perCatMap.get(cat) || 0) + 1)
  }
  const perCat = Array.from(perCatMap.entries()).map(([category, count]) => ({ category, count }))
  perCat.sort((a, b) => b.count - a.count)
  const totalCat = perCat.reduce((a, b) => a + b.count, 0) || 1
  let running = 0
  const pareto = perCat.map(x => {
    running += x.count
    return { category: x.category, count: x.count, cumulativePct: Math.round((running / totalCat) * 100) }
  })

  const volume: VolumeTrend = { byMonthCategory, seasonality, rolling28, pareto }

  // Lifecycle & speed
  const funnelStages = ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "FEEDBACK_GIVEN", "CLOSED"]
  const funnel = funnelStages.map(stage => ({ stage, count: allReports.filter(r => (r.status as string) === stage).length }))

  const ackTimesDays: number[] = []
  const firstResponseDays: number[] = []
  for (const r of allReports) {
    if (r.acknowledgedAt) {
      const days = (new Date(r.acknowledgedAt as Date).getTime() - (r.createdAt as Date).getTime()) / 86400000
      ackTimesDays.push(days)
    }
    const m = idToMsgs.get(r.id)
    if (m && m.handler.length > 0) {
      const first = m.handler.slice().sort((a, b) => a.getTime() - b.getTime())[0]
      const days = (first.getTime() - (r.createdAt as Date).getTime()) / 86400000
      firstResponseDays.push(days)
    }
  }
  const ackCyclePercentilesDays = {
    p50: Math.round(percentile(ackTimesDays, 50) * 100) / 100,
    p75: Math.round(percentile(ackTimesDays, 75) * 100) / 100,
    p95: Math.round(percentile(ackTimesDays, 95) * 100) / 100,
  }
  const firstResponsePercentilesDays = {
    p50: Math.round(percentile(firstResponseDays, 50) * 100) / 100,
    p75: Math.round(percentile(firstResponseDays, 75) * 100) / 100,
    p95: Math.round(percentile(firstResponseDays, 95) * 100) / 100,
  }

  const agingBuckets = [
    { label: "0–7d", count: 0 },
    { label: "8–30d", count: 0 },
    { label: "31–90d", count: 0 },
    { label: ">90d", count: 0 },
  ]
  for (const r of allReports) {
    if ((r.status as string) === "CLOSED") continue
    const age = Math.floor((now.getTime() - (r.createdAt as Date).getTime()) / 86400000)
    if (age <= 7) agingBuckets[0].count++
    else if (age <= 30) agingBuckets[1].count++
    else if (age <= 90) agingBuckets[2].count++
    else agingBuckets[3].count++
  }

  const byWeek = new Map<string, number[]>()
  for (const r of allReports) {
    if (!r.acknowledgedAt) continue
    const w = weekKey(r.createdAt as Date)
    const days = (new Date(r.acknowledgedAt as Date).getTime() - (r.createdAt as Date).getTime()) / 86400000
    const arr = byWeek.get(w) || []
    arr.push(days)
    byWeek.set(w, arr)
  }
  const controlMedianAckByWeek = Array.from(byWeek.entries())
    .map(([w, arr]) => ({ week: w, medianDays: Math.round(percentile(arr, 50) * 100) / 100 }))
    .sort((a, b) => (a.week < b.week ? -1 : 1))

  const lifecycle: LifecycleSpeed = {
    funnel,
    ackCyclePercentilesDays,
    firstResponsePercentilesDays,
    agingBuckets,
    controlMedianAckByWeek,
  }

  // Category / small multiples (12 months)
  const start = new Date(now)
  start.setMonth(start.getMonth() - 11)
  start.setDate(1)
  const multMap = new Map<string, number>()
  for (const r of allReports) {
    const d = new Date(r.createdAt as Date)
    if (d < start) continue
    const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
    const cat = catMap.get(r.categoryId) || "Uncategorized"
    const key = `${cat}__${month}`
    multMap.set(key, (multMap.get(key) || 0) + 1)
  }
  const smallMultiples = Array.from(multMap.entries()).map(([k, v]) => {
    const [category, month] = k.split("__")
    return { category, month, count: v }
  })

  const categoryRisk: CategoryRisk = { smallMultiples }

  return { kpis, volume, lifecycle, categoryRisk }
}


