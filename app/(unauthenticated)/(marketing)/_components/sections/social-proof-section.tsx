"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"
import { SectionWrapper } from "./section-wrapper"

const testimonials = [
  {
    name: "Katarzyna Nowak",
    role: "HR Manager",
    content:
      "Sygnalista gave our employees a safe place to speak up. We uncovered issues early and built more trust in the process.",
    rating: 5
  },
  {
    name: "Piotr Zieliński",
    role: "Compliance Officer",
    content:
      "The automatic SLA reminders keep our team on track and auditors love the register exports.",
    rating: 5
  },
  {
    name: "Anna Kowalska",
    role: "Legal Counsel",
    content:
      "Monthly snapshots and the tamper‑evident log make proving diligence effortless during reviews.",
    rating: 5
  }
]

export function SocialProofSection() {
  return (
    <SectionWrapper>
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-xl text-center">
          <motion.h2
            className="text-primary text-lg leading-8 font-semibold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Testimonials
          </motion.h2>
          <motion.p
            className="text-foreground mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Trusted by compliance teams
          </motion.p>
        </div>
        <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                className="bg-card ring-border relative rounded-2xl p-8 shadow-md ring-1"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1
                }}
                whileHover={{
                  y: -5,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                }}
              >
                <div className="flex items-center gap-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <blockquote className="text-muted-foreground mt-6 text-base leading-7">
                  <p>"{testimonial.content}"</p>
                </blockquote>
                <figcaption className="text-foreground mt-6 text-base font-semibold">
                  <div>{testimonial.name}</div>
                  <div className="text-muted-foreground mt-1 text-sm">
                    {testimonial.role}
                  </div>
                </figcaption>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
