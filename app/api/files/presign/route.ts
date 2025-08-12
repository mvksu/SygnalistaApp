import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { generatePresignedUploadUrl } from "@/lib/storage/s3"
import { presignedUploadSchema } from "@/lib/validation/upload"
import { db } from "@/db"
import { organizations } from "@/db/schema/organizations"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user and organization
    const { userId, orgId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization context required" },
        { status: 400 }
      )
    }

    // Verify organization exists
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId)
    })

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
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { filename, contentType, size, checksum, reportId, messageId } = validationResult.data

    // Generate presigned upload URL
    const { uploadUrl, storageKey } = await generatePresignedUploadUrl({
      filename,
      contentType,
      size,
      checksum,
      orgId,
      reportId,
      messageId,
    })

    // Return the presigned URL and storage key
    return NextResponse.json({
      uploadUrl,
      storageKey,
      expiresIn: 3600, // 1 hour
      fields: {
        key: storageKey,
        "Content-Type": contentType,
        checksum,
      }
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
