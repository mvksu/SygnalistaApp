import { redirect } from "next/navigation"

export default async function RedirectOldReportRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  redirect(`/reporting-channel/${encodeURIComponent(slug)}`)
}
