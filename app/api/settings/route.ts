import { NextRequest, NextResponse } from "next/server"
import { updateOrgSettings } from "@/src/server/services/settings"
import { getCurrentActorOrgMemberId, getAuditFingerprint } from "@/src/server/services/audit"
import { getDbOrgIdForClerkOrg } from "@/src/server/orgs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 })
    }

    if (!body.locale || !["en-US", "pl-PL"].includes(body.locale)) {
      return NextResponse.json({ error: "Invalid locale" }, { status: 400 })
    }

    if (!body.retentionDays || body.retentionDays < 1 || body.retentionDays > 3650) {
      return NextResponse.json({ error: "Retention days must be between 1 and 3650" }, { status: 400 })
    }

    if (!body.ackDays || body.ackDays < 1 || body.ackDays > 365) {
      return NextResponse.json({ error: "Acknowledge window must be between 1 and 365 days" }, { status: 400 })
    }

    if (!body.feedbackMonths || body.feedbackMonths < 1 || body.feedbackMonths > 24) {
      return NextResponse.json({ error: "Feedback window must be between 1 and 24 months" }, { status: 400 })
    }

    // Get organization context
    const { orgId: clerkOrgId } = await import("@clerk/nextjs/server").then(m => m.auth())
    if (!clerkOrgId) {
      return NextResponse.json({ error: "Organization context required" }, { status: 401 })
    }

    const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
    
    // Get audit fingerprint
    const fp = await getAuditFingerprint(request)
    const { orgMemberId } = await getCurrentActorOrgMemberId()

    // Update settings
    await updateOrgSettings(orgId, {
      name: body.name.trim(),
      locale: body.locale,
      retentionDays: body.retentionDays,
      anonymousAllowed: !!body.anonymousAllowed,
      ackDays: body.ackDays,
      feedbackMonths: body.feedbackMonths,
      slaEnabled: !!body.slaEnabled,
      actorId: orgMemberId,
      ipHash: fp.ipHash,
      uaHash: fp.uaHash,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Settings update error:", error)
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
}
