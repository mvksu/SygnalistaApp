import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  const language = (user.publicMetadata as any)?.language || "en-US"
  const phone = user.phoneNumbers?.[0]?.phoneNumber || ""
  return NextResponse.json({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.emailAddresses?.[0]?.emailAddress || "",
    imageUrl: user.imageUrl,
    phone,
    language
  })
}

export async function PATCH(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const { firstName, lastName, language } = body as { firstName?: string; lastName?: string; language?: string }

  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  const nextPublic = {
    ...(user.publicMetadata || {}),
    ...(language ? { language } : {})
  }

  await clerkClient.users.updateUser(userId, {
    ...(firstName !== undefined ? { firstName } : {}),
    ...(lastName !== undefined ? { lastName } : {}),
    publicMetadata: nextPublic
  } as any)

  return NextResponse.json({ ok: true })
}



