import { z } from "zod"

export const reporterContactSchema = z.object({
  email: z.string().email().optional(),
  phone: z
    .string()
    .regex(/^[+0-9\s().-]{7,20}$/i, "Invalid phone number")
    .optional(),
})

export const attachmentClientSchema = z.object({
  filename: z.string().min(1).max(255),
  size: z.number().positive(),
  contentType: z.string().min(1),
  // Optional until upload flow stores these
  checksum: z.string().optional(),
  storageKey: z.string().optional(),
})

export const reportIntakeSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  body: z.string().min(20, "Please provide more details (min 20 chars)"),
  anonymous: z.boolean().default(true),
  contact: reporterContactSchema.optional(),
  attachments: z.array(attachmentClientSchema).max(5).default([]),
})

export type ReporterContact = z.infer<typeof reporterContactSchema>
export type AttachmentClient = z.infer<typeof attachmentClientSchema>
export type ReportIntake = z.infer<typeof reportIntakeSchema>


