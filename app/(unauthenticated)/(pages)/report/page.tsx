import ReportForm from "@/components/report/report-form"
import { NextResponse } from "next/server"

// TODO: Replace with real categories from DB when API is ready
const demoCategories = [
  { id: "safety", name: "Safety" },
  { id: "fraud", name: "Fraud" },
  { id: "harassment", name: "Harassment" },
]

export default function ReportPage() {
  async function handleSubmit(formData: any) {
    // Placeholder: this will POST to /api/reports in Step 15
    // For now, just noop
    console.log("submit", formData)
  }

  const captchaProvider = (process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER as "turnstile" | "hcaptcha") || "turnstile"
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ""

  return (
    <div className="container mx-auto max-w-3xl py-10">
      <h1 className="text-2xl font-semibold mb-6">Submit a Report</h1>
      <ReportForm
        categories={demoCategories}
        captchaProvider={captchaProvider}
        captchaSiteKey={siteKey}
        onSubmit={handleSubmit}
      />
      <p className="mt-4 text-sm text-muted-foreground">You can submit anonymously. Your identity will not be stored unless you choose to provide contact information.</p>
    </div>
  )
}


