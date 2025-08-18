import { redirect } from "next/navigation"

export default async function SecureLinkRedirect({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	redirect(`/reporting-channel/${slug}`)
}


