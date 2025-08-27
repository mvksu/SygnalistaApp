"use client"

import { useState } from "react"
import { Check, Copy as CopyIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

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
                <Button
                        type="button"
                        onClick={onCopy}
                        className={className}
                        aria-live="polite"
                        title={copied ? "Copied" : "Copy"}
                        variant="ghost"
                        size={iconOnly ? "icon" : "sm"}
                >
                        {iconOnly ? (
                                copied ? <Check className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />
                        ) : (
                                copied ? "Copied" : <><CopyIcon className="h-4 w-4" /> Copy</>
                        )}
                        
                </Button>
        )
}


