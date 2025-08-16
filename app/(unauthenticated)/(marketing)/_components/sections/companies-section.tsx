"use client"

import { motion } from "framer-motion"
import { SectionWrapper } from "./section-wrapper"

const stats = [
	{ label: "Organizations helped", value: "500+" },
	{ label: "Reports created", value: "1000+" },
	{ label: "Contributors", value: "50+" }
]

// Compliance/Security badges for marquee
const badges: { label: string; Icon: () => React.ReactElement }[] = [
	{
		label: "ISO 27001 Certified",
		Icon: () => (
			<svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
				<circle cx="12" cy="12" r="10" className="fill-current opacity-20" />
				<path d="M7 12h10" className="stroke-current" strokeWidth="1.8" strokeLinecap="round" />
				<path d="M12 7v10" className="stroke-current" strokeWidth="1.8" strokeLinecap="round" />
			</svg>
		)
	},
	{
		label: "GDPR Compliant",
		Icon: () => (
			<svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
				<circle cx="12" cy="12" r="9" className="fill-current opacity-20" />
				<path d="M12 6l1.8 3.6L18 10.2l-3 2.9.7 4.1L12 15.8 8.3 17.2l.7-4.1-3-2.9 4.2-.6L12 6z" className="fill-current" />
			</svg>
		)
	},
	{
		label: "Local Data Storage",
		Icon: () => (
			<svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
				<path d="M7 15a4 4 0 010-8 5 5 0 019.6 1.6A3.5 3.5 0 0117.5 15H7z" className="fill-current opacity-20" />
				<path d="M6 17h12" className="stroke-current" strokeWidth="1.8" strokeLinecap="round" />
			</svg>
		)
	},
	{
		label: "End-to-End Encryption",
		Icon: () => (
			<svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
				<rect x="5" y="10" width="14" height="9" rx="2" className="fill-current opacity-20" />
				<path d="M8 10V8a4 4 0 118 0v2" className="stroke-current" strokeWidth="1.8" strokeLinecap="round" />
			</svg>
		)
	},
	{
		label: "Penetration Tested",
		Icon: () => (
			<svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
				<path d="M12 3l7 4v5c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V7l7-4z" className="fill-current opacity-20" />
				<path d="M9 12l2 2 4-4" className="stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
		)
	},
	{
		label: "Servers Certification SOC 2",
		Icon: () => (
			<svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
				<circle cx="12" cy="12" r="9" className="fill-current opacity-20" />
				<path d="M7 12h10M9 9h6M9 15h6" className="stroke-current" strokeWidth="1.6" strokeLinecap="round" />
			</svg>
		)
	}
]

export function CompaniesSection() {
  return (
    <SectionWrapper>
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            Built with the best
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-8">
            Trusted technologies that power thousands of production applications
          </p>
        </motion.div>

        {/* Compliance Marquee */}
        <div className="relative mt-16">
          <div className="from-background absolute top-0 bottom-0 left-0 z-10 w-20 bg-gradient-to-r to-transparent" />
          <div className="from-background absolute top-0 right-0 bottom-0 z-10 w-20 bg-gradient-to-l to-transparent" />

          <div className="flex overflow-hidden">
            <motion.div
              className="flex gap-8 pr-8"
              animate={{ x: ["0%", "-100%"] }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {[...badges, ...badges].map((item, index) => (
                <div
                  key={`${item.label}-${index}`}
                  className="bg-muted text-foreground flex items-center gap-3 rounded-lg px-5 py-3 text-sm font-semibold whitespace-nowrap"
                >
                  <span className="bg-foreground/10 text-foreground inline-flex h-10 w-10 items-center justify-center rounded-xl">
                    <item.Icon />
                  </span>
                  <span className="hidden sm:inline-block">{item.label}</span>
                  <span className="sm:hidden">{item.label.replace("Servers Certification ", "")}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Stats */}
        <motion.dl
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-10 text-center sm:mt-20 sm:grid-cols-3 sm:gap-y-16 lg:mx-0 lg:max-w-none"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="mx-auto flex max-w-xs flex-col gap-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
              <dt className="text-muted-foreground text-base leading-7">
                {stat.label}
              </dt>
              <dd className="text-foreground order-first text-3xl font-semibold tracking-tight sm:text-5xl">
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: 0.4 + index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  className="inline-block"
                >
                  {stat.value}
                </motion.span>
              </dd>
            </motion.div>
          ))}
        </motion.dl>
      </div>
    </SectionWrapper>
  )
}
