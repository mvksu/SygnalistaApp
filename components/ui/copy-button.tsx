"use client"

import { useState } from "react"
import { Check, Copy as CopyIcon } from "lucide-react"

export function CopyButton({ text, className, iconOnly }: { text: string; className?: string; iconOnly?: boolean }) {
	const [copied, setCopied] = useState(false)

	async function onCopy() {
		try {
			await navigator.clipboard.writeText(text)
			setCopied(true)
			setTimeout(() => setCopied(false), 1500)
		} catch {}
	}

	return (
		<button type="button" onClick={onCopy} className={className} aria-live="polite" title={copied ? "Copied" : "Copy"}>
			{iconOnly ? (
				copied ? <Check className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />
			) : (
				copied ? "Copied" : "Copy"
			)}
		</button>
	)
}


