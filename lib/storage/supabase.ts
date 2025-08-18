import { createClient } from "@supabase/supabase-js"
import { createHash } from "crypto"
import { isAllowedMimeType, getFileSizeLimit } from "@/lib/validation/upload"

// Supabase Storage configuration
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "uploads"

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
  )
}

// Admin client (server-side only)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// Storage configuration
export const STORAGE_CONFIG = {
  bucket: SUPABASE_STORAGE_BUCKET,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/gzip",
    "application/x-tar",
  ],
} as const

export interface FileMetadata {
  filename: string
  contentType: string
  size: number
  checksum: string
  orgId: string
  reportId?: string
  messageId?: string
}

export function generateStorageKey(metadata: FileMetadata): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  const extension = metadata.filename.split(".").pop() || ""

  if (metadata.reportId) {
    return `orgs/${metadata.orgId}/reports/${metadata.reportId}/${timestamp}-${randomId}.${extension}`
  } else if (metadata.messageId) {
    return `orgs/${metadata.orgId}/messages/${metadata.messageId}/${timestamp}-${randomId}.${extension}`
  } else {
    return `orgs/${metadata.orgId}/uploads/${timestamp}-${randomId}.${extension}`
  }
}

// Generate signed upload URL for Supabase Storage
export async function generatePresignedUploadUrl(
  metadata: FileMetadata,
  _expiresIn: number = 3600 // not used by Supabase for upload; token has short TTL
): Promise<{ uploadUrl: string; storageKey: string; token?: string }> {
  if (!isAllowedMimeType(metadata.contentType)) {
    throw new Error(`File type ${metadata.contentType} is not allowed`)
  }

  const sizeLimit = getFileSizeLimit(metadata.contentType)
  if (metadata.size > sizeLimit) {
    throw new Error(`File size ${metadata.size} exceeds limit ${sizeLimit} for type ${metadata.contentType}`)
  }

  const storageKey = generateStorageKey(metadata)

  const { data, error } = await supabaseAdmin
    .storage
    .from(STORAGE_CONFIG.bucket)
    .createSignedUploadUrl(storageKey)

  if (error || !data) {
    // If bucket is missing, create it once and retry
    if ((error as any)?.statusCode === 404 || (error as any)?.message?.includes("does not exist")) {
      const { error: createErr } = await supabaseAdmin.storage.createBucket(STORAGE_CONFIG.bucket, { public: false })
      if (createErr) {
        throw new Error(createErr.message)
      }
      const retry = await supabaseAdmin.storage.from(STORAGE_CONFIG.bucket).createSignedUploadUrl(storageKey)
      if (retry.error || !retry.data) {
        throw new Error(retry.error?.message || "Failed to create signed upload URL (after bucket create)")
      }
      return { uploadUrl: retry.data.signedUrl, storageKey: retry.data.path, token: (retry.data as any).token }
    }
    throw new Error((error as any)?.message || "Failed to create signed upload URL")
  }

  // data has: signedUrl, path, token
  return { uploadUrl: data.signedUrl, storageKey: data.path, token: (data as any).token }
}

// Generate signed download URL for Supabase Storage
export async function generatePresignedDownloadUrl(
  storageKey: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .storage
    .from(STORAGE_CONFIG.bucket)
    .createSignedUrl(storageKey, expiresIn)

  if (error || !data) {
    throw new Error(error?.message || "Failed to create signed download URL")
  }

  return data.signedUrl
}

export async function deleteFile(storageKey: string): Promise<void> {
  const { error } = await supabaseAdmin
    .storage
    .from(STORAGE_CONFIG.bucket)
    .remove([storageKey])

  if (error) {
    throw new Error(error.message)
  }
}

export function computeFileChecksum(buffer: Buffer, algorithm: "md5" | "sha256" = "sha256"): string {
  const hash = createHash(algorithm)
  hash.update(buffer)
  return hash.digest("hex")
}

export function validateFileForUpload(
  filename: string,
  contentType: string,
  size: number
): { isValid: boolean; error?: string } {
  if (!isAllowedMimeType(contentType)) {
    return { isValid: false, error: `File type ${contentType} is not allowed` }
  }

  const sizeLimit = getFileSizeLimit(contentType)
  if (size > sizeLimit) {
    return { isValid: false, error: `File size ${size} exceeds limit ${sizeLimit} for type ${contentType}` }
  }

  if (!filename || filename.length > 255) {
    return { isValid: false, error: "Invalid filename" }
  }

  return { isValid: true }
}


