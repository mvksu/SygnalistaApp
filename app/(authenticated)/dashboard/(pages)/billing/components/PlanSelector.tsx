"use client"

import { useMemo, useState } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "tweakcn/ui/button"

type Plan = "free" | "pro" | "enterprise"

export default function PlanSelector({ currentPlan }: { currentPlan: Plan }) {
  const [employees, setEmployees] = useState(150)
  const sliderStops = [150, 500, 1000, 2000, 3500, 5000]

  const price = useMemo(() => {
    if (employees <= 150) return 159
    if (employees <= 500) return 259
    if (employees <= 1000) return 399
    if (employees <= 2000) return 599
    if (employees <= 3500) return 899
    return 1299
  }, [employees])

  const plans: Array<{ key: Plan; title: string; price?: number; features: string[]; cta: string }> = [
    { key: "free", title: "Starter", price: 159, features: ["Online case submission", "Case management", "5 members", "Secure two-way messaging", "Data & insights", "Basic AI features"], cta: "Switch to plan" },
    { key: "pro", title: "Professional", price, features: ["Unlimited forms", "120+ use cases", "10 members", "Surveys with follow-ups", "Engagement-boosting features", "HR & Compliance assistant", "Seamless native integrations"], cta: "Buy" },
    { key: "enterprise", title: "Enterprise", features: ["Telephone hotline", "Unlimited members", "Custom server locations", "Dedicated Success Manager", "Single Sign-On (SSO)"], cta: "Contact sales" },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded border p-4">
        <div className="mb-2 text-center text-lg font-medium">How many employees do you have?</div>
        <div className="px-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <input
                type="range"
                min={sliderStops[0]}
                max={sliderStops[sliderStops.length - 1]}
                step={50}
                value={employees}
                onChange={e => setEmployees(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </TooltipTrigger>
            <TooltipContent>Drag to estimate pricing by employee count</TooltipContent>
          </Tooltip>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>Up to 150</span>
            <span>Up to 500</span>
            <span>Up to 1000</span>
            <span>Up to 2000</span>
            <span>Up to 3500</span>
            <span>Over 3500</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = currentPlan === (p.key === "free" ? "free" : p.key)
          const highlight = p.key === "pro"
          return (
            <div key={p.key} className={`rounded border ${highlight ? "ring-2 ring-primary" : ""}`}>
              <div className={`p-4 ${isCurrent ? "bg-primary/10" : "bg-muted/30"}`}>
                <div className="text-xs text-muted-foreground">{isCurrent ? "Current plan" : "In this version"}</div>
                <div className="mt-1 text-lg font-semibold">{p.title}</div>
              </div>
              <div className="p-4 space-y-4">
                {p.price !== undefined && (
                  <div>
                    <div className="text-3xl font-bold">€{p.price}</div>
                    <div className="text-xs text-muted-foreground">Monthly, billed annually</div>
                  </div>
                )}
                <ul className="space-y-2 text-sm">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2"><span className="text-primary">•</span><span>{f}</span></li>
                  ))}
                </ul>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className={`w-full ${highlight ? "bg-primary text-primary-foreground" : ""} px-3 py-2 text-sm`}
                      variant={highlight ? "primary" : "outline"}
                      size="sm"
                    >
                      {p.cta}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{p.key === "enterprise" ? "Contact us for a tailored plan" : "Proceed to checkout"}</TooltipContent>
                </Tooltip>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


