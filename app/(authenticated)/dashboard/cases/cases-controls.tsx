"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet"

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
    p.delete("status")
    p.delete("categoryId")
    p.delete("period")
    router.replace(`${pathname}?${p.toString()}`)
    setOpen(false)
  }, [pathname, router, searchParams])

  return (
    <Card className="flex flex-wrap items-center justify-between gap-2 p-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search case id..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="text-sm underline">
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[360px] p-4">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">Status</div>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    {[
                      "OPEN",
                      "ACKNOWLEDGED",
                      "IN_PROGRESS",
                      "FEEDBACK_GIVEN",
                      "CLOSED",
                      "RESOLVED",
                      "NEW",
                      "ACTIVE"
                    ].map(s => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">Category</div>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    {props.categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">Period</div>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  className="w-full"
                  variant="default"
                  onClick={applyFilters}
                >
                  Apply
                </Button>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </Card>
  )
}
