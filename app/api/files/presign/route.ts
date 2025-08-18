import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { generatePresignedUploadUrl } from "@/lib/storage/supabase"
import { presignedUploadSchema } from "@/lib/validation/upload"
import { db } from "@/db"
import { organizations } from "@/db/schema/organizations"
import { reportingChannels } from "@/db/schema/reportingChannels"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    // Resolve organization context
    const url = new URL(request.url)
    const channelSlug = request.headers.get("x-channel-slug") || url.searchParams.get("channel") || undefined
    let resolvedOrgId: string | null = null

    const { userId, orgId } = await auth()
    if (userId && orgId) {
      const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
      resolvedOrgId = await getDbOrgIdForClerkOrg(orgId)
    } else if (channelSlug) {
      const channel = await db.query.reportingChannels.findFirst({ where: eq(reportingChannels.slug, channelSlug) })
      if (!channel) return NextResponse.json({ error: "Invalid channel" }, { status: 400 })
      resolvedOrgId = channel.orgId
    } else {
      return NextResponse.json({ error: "Organization context required" }, { status: 400 })
    }

    // Verify organization exists
    const org = await db.query.organizations.findFirst({ where: eq(organizations.id, resolvedOrgId) })

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = presignedUploadSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data",
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { filename, contentType, size, checksum, reportId, messageId } = validationResult.data

    // Generate presigned upload URL
    const { uploadUrl, storageKey, token } = await generatePresignedUploadUrl({
      filename,
      contentType,
      size,
      checksum,
      orgId: resolvedOrgId!,
      reportId,
      messageId,
    })

    // Return the signed upload details (Supabase)
    return NextResponse.json({
      uploadUrl,
      storageKey,
      expiresIn: 3600, // 1 hour
      // Supabase signed upload also requires a token alongside the URL
      // Clients should use supabase-js uploadToSignedUrl, or POST with this token header
      token,
    })

  } catch (error) {
    console.error("Error generating presigned upload URL:", error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Optional: GET endpoint to check if presigned URLs are working
export async function GET() {
  return NextResponse.json({
    message: "Presigned upload endpoint is working",
    status: "ok"
  })
}
