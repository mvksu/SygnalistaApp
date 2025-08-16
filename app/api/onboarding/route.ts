import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getSteps, setStepCompleted, type OnboardingKey } from "@/src/server/services/onboarding"
import { db } from "@/db"
import { users } from "@/db/schema/users"
import { eq } from "drizzle-orm"

async function getOrCreateUserId(): Promise<string | null> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null
  const existing = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (existing) return existing.id
  const u = await currentUser()
  const [row] = await db
    .insert(users)
    .values({
      clerkId,
      email: u?.emailAddresses?.[0]?.emailAddress || "",
      name: `${u?.firstName || ""} ${u?.lastName || ""}`.trim()
    })
    .returning()
  return row?.id || null
}

export async function GET() {
  const userId = await getOrCreateUserId()
  if (!userId) return NextResponse.json({}, { status: 200 })
  const steps = await getSteps(userId)
  return NextResponse.json(steps)
}

export async function POST(req: NextRequest) {
  const userId = await getOrCreateUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const key = String(body?.key || "") as OnboardingKey
  await setStepCompleted(userId, key)
  return NextResponse.json({ ok: true })
}


