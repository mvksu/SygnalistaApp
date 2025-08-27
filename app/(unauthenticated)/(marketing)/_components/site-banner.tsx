"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Button } from "tweakcn/ui/button"

export function SiteBanner() {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          transition={{ duration: 0.2 }}
          className="bg-brand-primary text-brand-primary-foreground relative"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative flex items-center justify-center py-3">
              <div className="flex items-center gap-3">
                <Link
                  href="/pricing"
                  className="inline-flex items-center text-sm font-semibold underline-offset-2 hover:underline"
                >
                  <span className="mr-1">🎉</span> Test your demo app{" "}
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </div>
              <Button
                onClick={handleDismiss}
                className="absolute right-0 rounded p-1 transition-colors hover:bg-white/10"
                aria-label="Dismiss banner"
                variant="ghost"
                size="icon"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
