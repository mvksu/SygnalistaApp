import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core"

export const plan = pgEnum("plan", ["free", "pro"]) // extend later as needed

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: plan("plan").default("free").notNull(),
  retentionDays: integer("retention_days").default(365).notNull(),
  locale: text("locale").default("pl-PL").notNull(),
  logoUrl: text("logo_url"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertOrganization = typeof organizations.$inferInsert
export type SelectOrganization = typeof organizations.$inferSelect


