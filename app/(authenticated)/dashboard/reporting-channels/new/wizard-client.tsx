"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function WizardClient() {
	const router = useRouter()
	const [name, setName] = useState("")
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	function toSlug(v: string) {
		return v
			.toLowerCase()
			.normalize("NFKD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 48)
	}

	async function handleCreate() {
		setError(null)
		const n = name.trim()
		if (!n) {
			setError("Please enter a name")
			return
		}
		const slug = toSlug(n)
		setSubmitting(true)
		try {
			const res = await fetch("/api/reporting-channels", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				// type and defaultLanguage omitted — API defaults to links/auto
				body: JSON.stringify({ name: n, slug })
			})
			if (!res.ok) {
				const data = await res.json().catch(() => ({}))
				throw new Error(data?.error || "Failed to create channel")
			}
			const row: { id: string } = await res.json()
			router.replace(`/dashboard/reporting-channels/${row.id}`)
		} catch (e: any) {
			setError(String(e?.message || e))
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="rounded border p-4">
			<div className="space-y-4">
				<div className="space-y-1">
					<div className="text-sm font-medium">Channel name</div>
					<Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ethics hotline" />
					<p className="text-xs text-muted-foreground">We’ll start with a Links channel. You can adjust settings later.</p>
				</div>
				{error && <div className="text-sm text-red-600">{error}</div>}
				<div className="flex items-center gap-2">
					<Button onClick={handleCreate} disabled={submitting}>{submitting ? "Creating…" : "Create channel"}</Button>
				</div>
			</div>
		</div>
	)
}

