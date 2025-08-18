import * as React from "react"

export default function FeedbackTemplate({ orgName, caseId, feedbackAt }: { orgName: string; caseId: string; feedbackAt: Date }) {
  return (
    <div>
      <h2>Feedback update</h2>
      <p>Dear reporter,</p>
      <p>
        We have posted an update on your case <strong>{caseId}</strong> for <strong>{orgName}</strong> at {feedbackAt.toLocaleString()}.
      </p>
      <p>You can reply or provide additional information from your secure inbox.</p>
      <p>Regards,<br/>Compliance Team</p>
    </div>
  )
}


