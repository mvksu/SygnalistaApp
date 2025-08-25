"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

type Category = { id: string; name: string }

export function CasesControls(props: {
  initialQ?: string
  initialStatus?: string
  initialCategoryId?: string
  initialPeriod?: string
  categories: Category[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [q, setQ] = useState(props.initialQ || "")
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(props.initialStatus || "")
  const [categoryId, setCategoryId] = useState(props.initialCategoryId || "")
  const [period, setPeriod] = useState(props.initialPeriod || "all")

  // Debounced URL update for search
  useEffect(() => {
    const h = setTimeout(() => {
      const p = new URLSearchParams(searchParams?.toString())
      if (q) p.set("q", q)
      else p.delete("q")
      router.replace(`${pathname}?${p.toString()}`)
    }, 400)
    return () => clearTimeout(h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const applyFilters = useCallback(() => {
    const p = new URLSearchParams(searchParams?.toString())
    if (status) p.set("status", status)
    else p.delete("status")
    if (categoryId) p.set("categoryId", categoryId)
    else p.delete("categoryId")
    if (period && period !== "all") p.set("period", period)
    else p.delete("period")
    router.replace(`${pathname}?${p.toString()}`)
    setOpen(false)
  }, [searchParams, status, categoryId, period, pathname, router])

  const clearFilters = useCallback(() => {
    setStatus("")
    setCategoryId("")
    setPeriod("all")
    const p = new URLSearchParams(searchParams?.toString())
    p.delete("status"); p.delete("categoryId"); p.delete("period")
    router.replace(`${pathname}?${p.toString()}`)
    setOpen(false)
  }, [pathname, router, searchParams])

  return (
    <div className="flex flex-wrap items-center gap-2 justify-between">
      <div className="flex items-center gap-2">
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder="Search case id..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="text-sm underline">Filters</Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[360px] p-4">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">Status</div>
                <select className="border rounded px-3 py-2 w-full text-sm" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="">Any</option>
                  {[
                    "OPEN","ACKNOWLEDGED","IN_PROGRESS","FEEDBACK_GIVEN","CLOSED","RESOLVED","NEW","ACTIVE"
                  ].map(s => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">Category</div>
                <select className="border rounded px-3 py-2 w-full text-sm" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                  <option value="">Any</option>
                  {props.categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">Period</div>
                <select className="border rounded px-3 py-2 w-full text-sm" value={period} onChange={e => setPeriod(e.target.value)}>
                  <option value="all">All time</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="w-full" onClick={applyFilters}>Apply</Button>
                <Button className="w-full" variant="secondary" onClick={clearFilters}>Clear</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

    </div>
  )
}


