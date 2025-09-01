"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { SectionWrapper } from "./section-wrapper"

export function CTASection() {
  return (
    <SectionWrapper>
      <div className="mx-auto max-w-2xl text-center">
        <motion.h2
          className="text-3xl font-bold tracking-tight sm:text-4xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Ready to meet whistleblowing obligations?
        </motion.h2>
        <motion.p
          className="mx-auto mt-6 max-w-xl text-lg leading-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Launch a secure reporting channel in minutes and stay compliant
          effortlessly.
        </motion.p>
        <motion.div
          className="mt-10 flex items-center justify-center gap-x-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Button
            size="lg"
            className="bg-brand-primary text-brand-primary-foreground hover:bg-brand-primary-hover"
            asChild
          >
            <Link href="/signup">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="link"
            className="text-brand-primary hover:text-brand-primary-hover"
            asChild
          >
            <Link href="#features">
              View features <span aria-hidden="true">→</span>
            </Link>
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="mt-16 grid grid-cols-3 gap-8 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {[
            { label: "Anonymous reports", value: "100%" },
            { label: "SLA tracking", value: "7d / 3m" },
            { label: "Audit exports", value: "1‑click" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            >
              <dt className="text-muted-foreground text-sm font-medium">
                {stat.label}
              </dt>
              <dd className="from-brand-primary to-brand-secondary mt-2 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent">
                {stat.value}
              </dd>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </SectionWrapper>
  )
}
