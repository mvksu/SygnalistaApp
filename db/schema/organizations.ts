import {
  integer,
  pgEnum,
  pgTable,
  boolean,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core"

export const plan = pgEnum("plan", ["free", "pro"]) // extend later as needed

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkOrgId: text("clerk_org_id").unique().notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: plan("plan").default("free").notNull(),
  retentionDays: integer("retention_days").default(365).notNull(),
  ackDays: integer("ack_days").default(7).notNull(),
  feedbackMonths: integer("feedback_months").default(3).notNull(),
  locale: text("locale").default("pl-PL").notNull(),
  logoUrl: text("logo_url"),
  anonymousAllowed: boolean("anonymous_allowed").default(true).notNull(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertOrganization = typeof organizations.$inferInsert
export type SelectOrganization = typeof organizations.$inferSelect


