import { pgEnum, pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core"
import { users } from "./users"

export const onboardingSteps = pgTable("user_onboarding_steps", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type SelectOnboardingStep = typeof onboardingSteps.$inferSelect
export type InsertOnboardingStep = typeof onboardingSteps.$inferInsert


