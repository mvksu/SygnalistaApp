import { db } from "@/db"
import { onboardingSteps } from "@/db/schema/userOnboarding"
import { eq, and } from "drizzle-orm"

export type OnboardingKey = "watch_intro" | "invite_members" | "configure_access" | "brand_reporting" | "set_security_defaults"

export async function setStepCompleted(userId: string, key: OnboardingKey) {
  const existing = await db.query.onboardingSteps.findFirst({ where: and(eq(onboardingSteps.userId, userId), eq(onboardingSteps.key, key)) })
  if (existing) {
    await db.update(onboardingSteps).set({ completed: true, completedAt: new Date() }).where(eq(onboardingSteps.id, existing.id))
  } else {
    await db.insert(onboardingSteps).values({ userId, key, completed: true, completedAt: new Date() })
  }
}

export async function getSteps(userId: string): Promise<Record<OnboardingKey, boolean>> {
  const rows = await db.query.onboardingSteps.findMany({ where: eq(onboardingSteps.userId, userId) })
  const map = Object.fromEntries(rows.map(r => [r.key, r.completed])) as Record<OnboardingKey, boolean>
  return {
    watch_intro: !!map.watch_intro,
    invite_members: !!map.invite_members,
    configure_access: !!map.configure_access,
    brand_reporting: !!map.brand_reporting,
    set_security_defaults: !!map.set_security_defaults
  }
}


