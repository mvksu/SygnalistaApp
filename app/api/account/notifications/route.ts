import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  const pm = (user.publicMetadata as any) || {}
  return NextResponse.json({
    emailCaseUpdates: !!pm.emailCaseUpdates,
    emailAnnouncements: !!pm.emailAnnouncements
  })
}

export async function PATCH(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const { emailCaseUpdates, emailAnnouncements } = body as { emailCaseUpdates?: boolean; emailAnnouncements?: boolean }

  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  const pm = (user.publicMetadata as any) || {}
  await clerkClient.users.updateUser(userId, {
    publicMetadata: {
      ...pm,
      ...(emailCaseUpdates !== undefined ? { emailCaseUpdates: !!emailCaseUpdates } : {}),
      ...(emailAnnouncements !== undefined ? { emailAnnouncements: !!emailAnnouncements } : {})
    }
  } as any)
  return NextResponse.json({ ok: true })
}



