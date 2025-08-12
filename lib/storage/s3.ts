import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { createHash } from "crypto"
import { isAllowedMimeType, getFileSizeLimit } from "@/lib/validation/upload"

// S3/R2 configuration
const S3_ENDPOINT = process.env.S3_ENDPOINT
const S3_BUCKET = process.env.S3_BUCKET
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY
const S3_SECRET_KEY = process.env.S3_SECRET_KEY
const S3_REGION = process.env.S3_REGION || "auto"

// Validate required environment variables
if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY || !S3_SECRET_KEY) {
  throw new Error(
    "Missing S3 configuration. Please set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, and S3_SECRET_KEY environment variables."
  )
}

// Initialize S3 client
export const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  // For R2 compatibility
  forcePathStyle: true,
})

// Storage configuration
export const STORAGE_CONFIG = {
  bucket: S3_BUCKET,
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

// File metadata interface
export interface FileMetadata {
  filename: string
  contentType: string
  size: number
  checksum: string
  orgId: string
  reportId?: string
  messageId?: string
}

// Generate storage key for file
export function generateStorageKey(metadata: FileMetadata): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  const extension = metadata.filename.split('.').pop() || ''
  
  // Organize by org, then by type (reports vs messages), then by ID
  if (metadata.reportId) {
    return `orgs/${metadata.orgId}/reports/${metadata.reportId}/${timestamp}-${randomId}.${extension}`
  } else if (metadata.messageId) {
    return `orgs/${metadata.orgId}/messages/${metadata.messageId}/${timestamp}-${randomId}.${extension}`
  } else {
    return `orgs/${metadata.orgId}/uploads/${timestamp}-${randomId}.${extension}`
  }
}

// Generate presigned URL for file upload
export async function generatePresignedUploadUrl(
  metadata: FileMetadata,
  expiresIn: number = 3600 // 1 hour default
): Promise<{ uploadUrl: string; storageKey: string }> {
  // Validate file type and size
  if (!isAllowedMimeType(metadata.contentType)) {
    throw new Error(`File type ${metadata.contentType} is not allowed`)
  }

  const sizeLimit = getFileSizeLimit(metadata.contentType)
  if (metadata.size > sizeLimit) {
    throw new Error(`File size ${metadata.size} exceeds limit ${sizeLimit} for type ${metadata.contentType}`)
  }

  const storageKey = generateStorageKey(metadata)
  
  const command = new PutObjectCommand({
    Bucket: STORAGE_CONFIG.bucket,
    Key: storageKey,
    ContentType: metadata.contentType,
    ContentLength: metadata.size,
    Metadata: {
      originalFilename: metadata.filename,
      checksum: metadata.checksum,
      orgId: metadata.orgId,
      reportId: metadata.reportId || '',
      messageId: metadata.messageId || '',
      uploadedAt: new Date().toISOString(),
    },
  })

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn })
  
  return { uploadUrl, storageKey }
}

// Generate presigned URL for file download
export async function generatePresignedDownloadUrl(
  storageKey: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: STORAGE_CONFIG.bucket,
    Key: storageKey,
  })

  return await getSignedUrl(s3Client, command, { expiresIn })
}

// Delete file from storage
export async function deleteFile(storageKey: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: STORAGE_CONFIG.bucket,
    Key: storageKey,
  })

  await s3Client.send(command)
}

// Compute file checksum (MD5 for compatibility, SHA256 for security)
export function computeFileChecksum(buffer: Buffer, algorithm: 'md5' | 'sha256' = 'sha256'): string {
  const hash = createHash(algorithm)
  hash.update(buffer)
  return hash.digest('hex')
}

// Validate file before upload
export function validateFileForUpload(
  filename: string,
  contentType: string,
  size: number
): { isValid: boolean; error?: string } {
  // Check file type
  if (!isAllowedMimeType(contentType)) {
    return { isValid: false, error: `File type ${contentType} is not allowed` }
  }

  // Check file size
  const sizeLimit = getFileSizeLimit(contentType)
  if (size > sizeLimit) {
    return { isValid: false, error: `File size ${size} exceeds limit ${sizeLimit} for type ${contentType}` }
  }

  // Check filename
  if (!filename || filename.length > 255) {
    return { isValid: false, error: 'Invalid filename' }
  }

  return { isValid: true }
}

// Get file info from storage (metadata only, no content)
export async function getFileInfo(storageKey: string): Promise<{
  exists: boolean
  size?: number
  lastModified?: Date
  metadata?: Record<string, string>
}> {
  try {
    const command = new GetObjectCommand({
      Bucket: STORAGE_CONFIG.bucket,
      Key: storageKey,
    })

    const response = await s3Client.send(command)
    
    return {
      exists: true,
      size: response.ContentLength,
      lastModified: response.LastModified,
      metadata: response.Metadata,
    }
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      return { exists: false }
    }
    throw error
  }
}
