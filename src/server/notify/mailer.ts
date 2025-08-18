import { Resend } from "resend"
import AcknowledgeTemplate from "@/src/server/notify/templates/acknowledge"
import FeedbackTemplate from "@/src/server/notify/templates/feedback"

type SendOptions = {
  to: string
  subject: string
  react: React.ReactElement
}

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

function getFromAddress(): string | null {
  return process.env.RESEND_FROM || null
}

export async function sendMail(options: SendOptions): Promise<void> {
  const client = getClient()
  const from = getFromAddress()
  if (!client || !from) {
    // Soft-fail in dev or if not configured
    if (process.env.NODE_ENV !== "production") {
      console.warn("[mailer] Skipping send (missing RESEND_API_KEY or RESEND_FROM)", {
        to: options.to,
        subject: options.subject,
      })
      return
    }
    return
  }
  await client.emails.send({ from, to: options.to, subject: options.subject, react: options.react })
}

export async function sendAcknowledgeEmail(params: {
  to: string
  orgName: string
  caseId: string
  createdAt: Date
}) {
  await sendMail({
    to: params.to,
    subject: `[${params.orgName}] Acknowledgement for case ${params.caseId}`,
    react: AcknowledgeTemplate({ orgName: params.orgName, caseId: params.caseId, createdAt: params.createdAt }),
  })
}

export async function sendFeedbackEmail(params: {
  to: string
  orgName: string
  caseId: string
  feedbackAt: Date
}) {
  await sendMail({
    to: params.to,
    subject: `[${params.orgName}] Feedback update for case ${params.caseId}`,
    react: FeedbackTemplate({ orgName: params.orgName, caseId: params.caseId, feedbackAt: params.feedbackAt }),
  })
}


