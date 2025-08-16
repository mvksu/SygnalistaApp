"use client"

import { createCheckoutSession, createCheckoutUrl } from "@/actions/stripe"
import { useAuth } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export function CheckoutRedirect() {
  const { isSignedIn } = useAuth()
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    const handlePendingCheckout = async () => {
      // Only run once per mount and if signed in
      if (!isSignedIn || hasChecked) return

      setHasChecked(true)

      const pendingPlan = sessionStorage.getItem("pendingPlan")
      const pendingCheckout = sessionStorage.getItem("pendingCheckout")
      if (!pendingPlan && !pendingCheckout) return

      // Clear the pending checkout immediately to prevent loops
      sessionStorage.removeItem("pendingPlan")
      sessionStorage.removeItem("pendingCheckout")

      try {
        let result
        if (pendingPlan === "monthly" || pendingPlan === "yearly") {
          result = await createCheckoutSession(pendingPlan)
        } else if (pendingCheckout) {
          result = await createCheckoutUrl(pendingCheckout)
        } else {
          return
        }

        if (result.error) {
          toast.error(result.error)
          return
        }

        if (result.url) {
          // Redirect to Stripe checkout
          window.location.href = result.url
        }
      } catch (error) {
        console.error("Checkout redirect error:", error)
        toast.error("Failed to redirect to checkout")
      }
    }

    handlePendingCheckout()
  }, [isSignedIn, hasChecked])

  return null
}
