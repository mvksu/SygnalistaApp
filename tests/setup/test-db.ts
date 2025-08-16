import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js"
import postgres from "postgres"

export function createTestDb() {
	const url = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
	if (!url) throw new Error("TEST_DATABASE_URL or DATABASE_URL must be set for integration tests")
	const client = postgres(url, { prepare: false })
	return drizzlePostgres(client)
}


