import { db } from "@/db"
import { organizations } from "@/db/schema/organizations"
import { eq } from "drizzle-orm"

export async function getDbOrgIdForClerkOrg(clerkOrgId: string): Promise<string> {
  // We reuse organizations.slug to store the Clerk org id for mapping
  const existing = await db.query.organizations.findFirst({ where: eq(organizations.slug, clerkOrgId) })
  if (existing) return existing.id

  const name = "Organization"
  const [inserted] = await db
    .insert(organizations)
    .values({ name, slug: clerkOrgId, plan: "free" as any })
    .returning()
  return inserted.id
}





