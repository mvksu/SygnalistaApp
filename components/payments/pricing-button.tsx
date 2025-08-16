"use client"

import { createCheckoutSession, createCheckoutUrl } from "@/actions/stripe"
import { Button } from "@/components/ui/button"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

interface PricingButtonProps {
  paymentLink?: string
  plan?: "monthly" | "yearly"
  children: React.ReactNode
  className?: string
  variant?: "default" | "outline" | "secondary"
}

export function PricingButton({
  paymentLink,
  plan,
  children,
  className,
  variant = "default"
}: PricingButtonProps) {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (!isSignedIn) {
      // Store intent for post-auth redirect
      if (plan) {
        sessionStorage.setItem("pendingPlan", plan)
      } else if (paymentLink) {
        sessionStorage.setItem("pendingCheckout", paymentLink)
      }
      toast.info("Please sign in to continue")
      router.push("/login")
      return
    }

    setIsLoading(true)
    try {
      let result: { url: string | null; error: string | null }

      if (plan) {
        result = await createCheckoutSession(plan)
      } else if (paymentLink) {
        result = await createCheckoutUrl(paymentLink)
      } else {
        throw new Error("No pricing information provided")
      }

      if (result.error) {
        throw new Error(result.error)
      }

      if (result.url) {
        window.location.href = result.url
      } else {
        throw new Error("No checkout URL received")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to start checkout"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      className={className}
      variant={variant}
    >
      {isLoading ? "Loading..." : children}
    </Button>
  )
}
