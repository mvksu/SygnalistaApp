"use server"

import {
  createCustomer,
  getCustomerByUserId,
  updateCustomerByStripeCustomerId,
  updateCustomerByUserId
} from "@/actions/customers"
import { SelectCustomer } from "@/db/schema/customers"
import { stripe } from "@/lib/stripe"
import { auth, currentUser } from "@clerk/nextjs/server"
import { headers } from "next/headers"
import Stripe from "stripe"

type MembershipStatus = SelectCustomer["membership"]

const getMembershipStatus = (
  status: Stripe.Subscription.Status,
  membership: MembershipStatus
): MembershipStatus => {
  switch (status) {
    case "active":
    case "trialing":
      return membership
    case "canceled":
    case "incomplete":
    case "incomplete_expired":
    case "past_due":
    case "paused":
    case "unpaid":
      return "free"
    default:
      return "free"
  }
}

const getSubscription = async (subscriptionId: string) => {
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["default_payment_method"]
  })
}

export const updateStripeCustomer = async (
  userId: string,
  subscriptionId: string,
  customerId: string
) => {
  try {
    if (!userId || !subscriptionId || !customerId) {
      throw new Error("Missing required parameters for updateStripeCustomer")
    }

    const subscription = await getSubscription(subscriptionId)

    // Check if customer exists
    const existingCustomer = await getCustomerByUserId(userId)

    let result
    if (!existingCustomer) {
      // Create customer first
      const createResult = await createCustomer(userId)
      if (!createResult.isSuccess) {
        throw new Error("Failed to create customer profile")
      }

      // Then update with Stripe data
      result = await updateCustomerByUserId(userId, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id
      })
    } else {
      // Customer exists, just update
      result = await updateCustomerByUserId(userId, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id
      })
    }

    if (!result.isSuccess) {
      throw new Error("Failed to update customer profile")
    }

    return result.data
  } catch (error) {
    console.error("Error in updateStripeCustomer:", error)
    throw error instanceof Error
      ? error
      : new Error("Failed to update Stripe customer")
  }
}

export const manageSubscriptionStatusChange = async (
  subscriptionId: string,
  customerId: string,
  productId: string
): Promise<MembershipStatus> => {
  try {
    if (!subscriptionId || !customerId || !productId) {
      throw new Error(
        "Missing required parameters for manageSubscriptionStatusChange"
      )
    }

    const subscription = await getSubscription(subscriptionId)
    const product = await stripe.products.retrieve(productId)

    const membership = product.metadata?.membership

    if (!membership || !["free", "pro"].includes(membership)) {
      throw new Error(
        `Invalid or missing membership type in product metadata: ${membership}`
      )
    }

    const validatedMembership = membership as MembershipStatus

    const membershipStatus = getMembershipStatus(
      subscription.status,
      validatedMembership
    )

    const updateResult = await updateCustomerByStripeCustomerId(customerId, {
      stripeSubscriptionId: subscription.id,
      membership: membershipStatus
    })

    if (!updateResult.isSuccess) {
      throw new Error("Failed to update subscription status")
    }

    return membershipStatus
  } catch (error) {
    console.error("Error in manageSubscriptionStatusChange:", error)
    throw error instanceof Error
      ? error
      : new Error("Failed to update subscription status")
  }
}

export const createCheckoutUrl = async (
  paymentLinkUrl: string
): Promise<{ url: string | null; error: string | null }> => {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { url: null, error: "User must be authenticated" }
    }

    if (!paymentLinkUrl) {
      return { url: null, error: "Payment link URL is required" }
    }

    // Add client_reference_id to the Stripe payment link
    const url = new URL(paymentLinkUrl)
    url.searchParams.set("client_reference_id", userId)

    // Prefill email so users don't have to type it again on Stripe Checkout
    const user = await currentUser()
    const email = user?.emailAddresses?.[0]?.emailAddress
    if (email) {
      url.searchParams.set("prefilled_email", email)
    }

    return { url: url.toString(), error: null }
  } catch (error) {
    console.error("Error creating checkout URL:", error)
    return {
      url: null,
      error:
        error instanceof Error ? error.message : "Failed to create checkout URL"
    }
  }
}

export const createCheckoutSession = async (
  plan: "monthly" | "yearly"
): Promise<{ url: string | null; error: string | null }> => {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { url: null, error: "User must be authenticated" }
    }

    const user = await currentUser()
    const email = user?.emailAddresses?.[0]?.emailAddress || undefined

    const priceMonthly = process.env.STRIPE_PRICE_PRO_MONTHLY
    const priceYearly = process.env.STRIPE_PRICE_PRO_YEARLY
    const priceId = plan === "monthly" ? priceMonthly : priceYearly

    // If price ID isn't configured, gracefully fall back to Payment Link envs
    if (!priceId) {
      const fallbackLink =
        plan === "monthly"
          ? process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY
          : process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_YEARLY

      if (fallbackLink) {
        const url = new URL(fallbackLink)
        url.searchParams.set("client_reference_id", userId)
        if (email) url.searchParams.set("prefilled_email", email)
        return { url: url.toString(), error: null }
      }

      return {
        url: null,
        error: `Missing Stripe price ID for ${plan}. Set STRIPE_PRICE_PRO_${plan.toUpperCase()} or NEXT_PUBLIC_STRIPE_PAYMENT_LINK_${plan.toUpperCase()} in env.`
      }
    }

    // Derive app URL
    const originHeader = (await headers()).get("origin")
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || originHeader || "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: userId,
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      allow_promotion_codes: true
    })

    return { url: session.url, error: null }
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return {
      url: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create checkout session"
    }
  }
}
