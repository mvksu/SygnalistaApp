"use client"

import { useState } from "react"
import ReportForm from "@/components/report/report-form"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"

type Props = {
  orgName: string
  channelSlug: string
  categories: { id: string; name: string }[]
  orgImgUrl: string
}

export default function ReportLandingClient({ orgName, channelSlug, categories, orgImgUrl }: Props) {
  const [started, setStarted] = useState(false)

  return (
    <Card className="space-y-8">
      {!started && (
        <>
          <CardHeader className="space-y-2 flex flex-col items-start">
            <img
              src={orgImgUrl}
              alt={`${orgName} logo`}
              className="h-12 w-12 object-contain mb-2"
            />
            <h1 className="text-2xl font-semibold">{orgName} Whistleblower Channel</h1>
            <p className="text-muted-foreground">
              As an employee, you can report serious matters anonymously or if you have reasonable suspicion of such matters.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <h2 className="text-lg font-semibold">Anonymous reporting of serious matters</h2>
            <p>
              Through this page, you can submit information about reprehensible matters or report actions that are unethical,
              illegal or in violation of internal policies. The scheme is to be used to bring matters to light that would not
              otherwise have come to light.
            </p>
            <p>
              It can be reported confidentially with indication of name and contact information or, if desired, 100% anonymously.
              All inquiries are treated confidentially and securely.
            </p>
          </CardContent>

          <CardContent className="space-y-4">
            <h3 className="font-medium">HR related matters</h3>
            <p>
              HR related matters cannot be reported in this system, but must instead be discussed with the immediate manager,
              director or HR.
            </p>
          </CardContent>

          <CardContent className="space-y-4">
            <p>From this page you are able to make a new secure report or follow up on an existing report.</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>You wish to see the status of your report, to check if action is being taken.</li>
              <li>You wish to provide additional information to your report.</li>
              <li>The system administrators has requested additional information from you to help them resolve the issue or take the appropriate action.</li>
            </ol>
          </CardContent>

          <CardContent className="flex items-center gap-2">
            <Button onClick={() => setStarted(true)} className="px-4 py-2" variant="primary" size="sm">
              Create New Report
            </Button>
            <a
              href={`/reporting-channel/${encodeURIComponent(channelSlug)}/checkcase`}
              onClick={(e) => {
                e.preventDefault()
                window.location.href = `/reporting-channel/${encodeURIComponent(channelSlug)}/checkcase`
              }}
              className="inline-flex rounded border px-4 py-2 text-sm"
            >
              Check Case
            </a>
          </CardContent>
        </>
      )}

      {started && (
        <CardContent id="report-form" className="space-y-4">
          <ReportForm categories={categories} channelSlug={channelSlug} />
        </CardContent>
      )}
    </Card>
  )
}


