import { pgTable, uuid, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core"
import { organizations } from "./organizations"

export const surveys = pgTable("surveys", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const surveyQuestions = pgTable("survey_questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  surveyId: uuid("survey_id").notNull().references(() => surveys.id, { onDelete: "cascade" }),
  idx: integer("idx").notNull(),
  question: text("question").notNull(),
})

export const surveyOptions = pgTable("survey_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id").notNull().references(() => surveyQuestions.id, { onDelete: "cascade" }),
  idx: integer("idx").notNull(),
  label: text("label").notNull(),
  count: integer("count").default(0).notNull(),
})

export type SelectSurvey = typeof surveys.$inferSelect
export type SelectSurveyQuestion = typeof surveyQuestions.$inferSelect
export type SelectSurveyOption = typeof surveyOptions.$inferSelect


