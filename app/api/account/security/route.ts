import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  const user = await clerkClient.users.getUser(userId)
  const mfaEnabled = user.twoFactorEnabled || false
  return NextResponse.json({ mfaEnabled })
}



