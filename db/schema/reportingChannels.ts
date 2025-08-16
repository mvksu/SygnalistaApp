import { pgTable, uuid, text, timestamp, pgEnum, uniqueIndex } from "drizzle-orm/pg-core"
import { organizations } from "./organizations"

export const reportingChannelType = pgEnum("reporting_channel_type", [
	"links",
	"phone",
	"email",
])

export const reportingChannels = pgTable(
    "reporting_channels",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        slug: text("slug").notNull().unique(),
        type: reportingChannelType("type").default("links").notNull(),
        defaultLanguage: text("default_language").default("auto").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (t) => ({
        uniqueOrgType: uniqueIndex("reporting_channels_org_type_idx").on(t.orgId, t.type),
    })
)

export type InsertReportingChannel = typeof reportingChannels.$inferInsert
export type SelectReportingChannel = typeof reportingChannels.$inferSelect


