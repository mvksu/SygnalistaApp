import { z } from "zod"

// File upload validation schema
export const uploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  size: z.number().positive().max(50 * 1024 * 1024), // 50MB max
  checksum: z.string().min(1), // MD5 or SHA256 hash
})

export const presignedUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  size: z.number().positive().max(50 * 1024 * 1024), // 50MB max
  // Optional checksum for integrity; client should compute (e.g., SHA-256 hex) if provided
  checksum: z.string().min(32).max(128).optional(),
  // Optional association targets to help generate organized storage keys
  reportId: z.string().optional(),
  messageId: z.string().optional(),
})

export type UploadData = z.infer<typeof uploadSchema>
export type PresignedUploadRequest = z.infer<typeof presignedUploadSchema>

// Allowed file types for security
export const ALLOWED_MIME_TYPES = [
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Archives
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  "application/gzip",
  "application/x-tar",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/aac",
  "audio/m4a",
  "audio/m4b",
  "audio/webm;codecs=opus"
] as const

export const isAllowedMimeType = (mimeType: string): boolean => {
  return ALLOWED_MIME_TYPES.includes(mimeType as any)
}

// File size limits by type
export const FILE_SIZE_LIMITS = {
  // Documents: 25MB
  "application/pdf": 25 * 1024 * 1024,
  "application/msword": 25 * 1024 * 1024,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": 25 * 1024 * 1024,
  "application/vnd.ms-excel": 25 * 1024 * 1024,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": 25 * 1024 * 1024,
  "application/vnd.ms-powerpoint": 25 * 1024 * 1024,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": 25 * 1024 * 1024,
  "text/plain": 10 * 1024 * 1024, // 10MB for text files
  "text/csv": 10 * 1024 * 1024,
  // Images: 10MB
  "image/jpeg": 10 * 1024 * 1024,
  "image/png": 10 * 1024 * 1024,
  "image/gif": 10 * 1024 * 1024,
  "image/webp": 10 * 1024 * 1024,
  "image/svg+xml": 5 * 1024 * 1024, // 5MB for SVG
  // Archives: 50MB
  "application/zip": 50 * 1024 * 1024,
  "application/x-rar-compressed": 50 * 1024 * 1024,
  "application/x-7z-compressed": 50 * 1024 * 1024,
  "application/gzip": 50 * 1024 * 1024,
  "application/x-tar": 50 * 1024 * 1024,
} as const

export const getFileSizeLimit = (mimeType: string): number => {
  return FILE_SIZE_LIMITS[mimeType as keyof typeof FILE_SIZE_LIMITS] || 10 * 1024 * 1024 // Default 10MB
}
