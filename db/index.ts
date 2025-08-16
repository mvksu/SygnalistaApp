import { config } from "dotenv"
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { customers } from "./schema/customers"
import { orgMembers } from "./schema/orgMembers"
import { organizations } from "./schema/organizations"
import { users } from "./schema/users"
import { reportCategories } from "./schema/reportCategories"
import { reports } from "./schema/reports"
import { reportMessages } from "./schema/reportMessages"
import { attachments } from "./schema/attachments"
import { slaEvents } from "./schema/sla"
import { reportingChannels } from "./schema/reportingChannels"
import { auditLog } from "./schema/audit"
import { exportsTable } from "./schema/exports"
import { surveys, surveyOptions, surveyQuestions } from "./schema/surveys"
import { onboardingSteps } from "./schema/userOnboarding"

config({ path: ".env.local" })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set")
}

const dbSchema = {
  organizations,
  users,
  orgMembers,
  customers,
  reportCategories,
  reports,
  reportMessages,
  attachments,
  slaEvents,
  auditLog,
  exportsTable,
  reportingChannels,
  surveys,
  surveyQuestions,
  surveyOptions
  ,onboardingSteps
}

function initializeDb(url: string) {
  const client = postgres(url, { prepare: false })
  return drizzlePostgres(client, { schema: dbSchema })
}

export const db = initializeDb(databaseUrl)
