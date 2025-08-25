import * as React from "react"

export default function AcknowledgeTemplate({ orgName, caseId, createdAt }: { orgName: string; caseId: string; createdAt: Date }) {
  return (
    <div>
      <h2>Case acknowledgement</h2>
      <p>Dear reporter,</p>
      <p>
        We confirm receipt of your case <strong>{caseId}</strong> for <strong>{orgName}</strong> on {createdAt.toLocaleString()}.
      </p>
      <p>
        Keep your case key safe. You can follow up securely via your reporting channel.
      </p>
      <p>Regards,<br/>Compliance Team</p>
    </div>
  )
}



