"use client"

import { motion } from "framer-motion"
import { SectionWrapper } from "./section-wrapper"

export function InsightsSection() {
	return (
		<SectionWrapper className="py-16 sm:py-24">
			<div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-accent/20 p-8 sm:p-12">
				{/* Decorative background blobs */}
				<div className="pointer-events-none absolute inset-0">
					<div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-gradient-to-br from-background/40 to-transparent blur-2xl" />
					<div className="absolute -right-24 top-10 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-background/30 to-transparent blur-3xl" />
					<div className="absolute left-1/2 top-0 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-gradient-to-b from-background/50 to-transparent blur-3xl" />
				</div>

				<motion.h2
					className="text-foreground relative z-10 text-center text-3xl font-bold tracking-tight sm:text-4xl"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5 }}
				>
					Unlock Valuable Employee Insights
				</motion.h2>

				<motion.p
					className="text-muted-foreground relative z-10 mx-auto mt-3 max-w-3xl text-center text-base sm:text-lg"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5, delay: 0.05 }}
				>
					Anonymous reporting gives employees a safe voice. Detect issues early, prevent misconduct,
					and lead with confidence—powered by real insights.
				</motion.p>

				<div className="relative z-10 mt-10 grid grid-cols-1 items-start gap-10 text-center sm:grid-cols-3">
					<motion.div
						initial={{ opacity: 0, y: 15 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.4, delay: 0.1 }}
						className="space-y-2"
					>
						<div className="text-4xl font-bold tracking-tight sm:text-5xl">20%</div>
						<p className="text-muted-foreground mx-auto max-w-xs text-sm">
							Reduction in employee turnover after adopting anonymous reporting
						</p>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 15 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.4, delay: 0.2 }}
						className="space-y-2"
					>
						<div className="text-4xl font-bold tracking-tight sm:text-5xl">4x</div>
						<p className="text-muted-foreground mx-auto max-w-xs text-sm">
							More issues reported and innovative ideas shared
						</p>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 15 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.4, delay: 0.3 }}
						className="space-y-2"
					>
						<div className="text-4xl font-bold tracking-tight sm:text-5xl">10×</div>
						<p className="text-muted-foreground mx-auto max-w-xs text-sm">
							More effective at detecting misconduct and fraud early
						</p>
					</motion.div>
				</div>
			</div>
		</SectionWrapper>
	)
}


