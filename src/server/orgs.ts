import { db } from "@/db"
import {
  organizations,
  type InsertOrganization
} from "@/db/schema/organizations"
import {
  reportCategories,
  type InsertReportCategory
} from "@/db/schema/reportCategories"
import { departments, type InsertDepartment } from "@/db/schema/departments"
import { randomUUID } from "crypto"
import { count, eq } from "drizzle-orm"

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) // keep room for suffix
}

export async function getDbOrgIdForClerkOrg(
  clerkOrgId: string,
  clerkOrgName?: string
): Promise<string> {
  // Map by Clerk org id column
  const existing = await db.query.organizations.findFirst({
    where: eq(organizations.clerkOrgId, clerkOrgId)
  })
  if (existing) return existing.id

  // 2) Insert new (with slug generation + collision handling)
  const base = slugify(clerkOrgName || "organization")
  const candidates = [base, `${base}-${crypto.randomUUID().slice(0, 2)}`]

  for (const candidateSlug of candidates) {
    try {
      const [row] = await db
        .insert(organizations)
        .values({
          // id: default
          clerkOrgId,
          name: clerkOrgName || "Organization",
          slug: candidateSlug
          // rely on defaults for plan/locale/etc.
        })
        .returning({ id: organizations.id })

      if (row) return row.id
    } catch (e: any) {
      // If unique-violation, try the next slug candidate, else rethrow
      const message = String(e?.message ?? e)
      const uniqueViolation =
        message.includes("duplicate key") ||
        message.includes("unique") ||
        e?.code === "23505" // Postgres unique_violation
      if (!uniqueViolation) throw e
    }
  }

  // 3) Fallback: reselect (handles concurrent creator “won the race”)
  const after = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.clerkOrgId, clerkOrgId))
    .limit(1)

  if (after.length) return after[0].id

  throw new Error("Failed to create or retrieve organization record.")
}

function defaultCategories() {
  return [
    { name: "Fraud", description: "Suspicious or fraudulent activity" },
    { name: "Harassment", description: "Bullying, harassment, or abuse" },
    { name: "Compliance", description: "Compliance and legal issues" },
    { name: "Safety", description: "Workplace safety concerns" }
  ] as const
}

// Update createDefaultOrg to insert default categories for the new org
export async function createDefaultOrg(
  clerkOrgId: string,
  clerkOrgName: string,
  clerkOrgSlug: string
) {
  const org = await db
    .select()
    .from(organizations)
    .where(eq(organizations.clerkOrgId, clerkOrgId))
    .limit(1)

  let orgId: string

  if (org.length === 0) {
    orgId = randomUUID()
    const insertOrg: InsertOrganization = {
      id: orgId,
      clerkOrgId,
      name: clerkOrgName ?? "Unnamed Organization",
      slug: clerkOrgSlug,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    await db.insert(organizations).values(insertOrg)
  } else {
    orgId = org[0].id
  }

  const [{ cnt }] = await db
    .select({ cnt: count() })
    .from(reportCategories)
    .where(eq(reportCategories.orgId, orgId))

  if (Number(cnt) === 0) {
    const defs: InsertReportCategory[] = defaultCategories().map(c => ({
      id: randomUUID(),
      orgId,
      name: c.name,
      description: c.description,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }))
    await db.insert(reportCategories).values(defs)
  }

  // Seed default department if none
  const existingDept = await db
    .select({ id: departments.id })
    .from(departments)
    .where(eq(departments.orgId, orgId))
    .limit(1)
  if (existingDept.length === 0) {
    const defDept: InsertDepartment = {
      orgId,
      name: "General",
      description: "Default department",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.insert(departments).values(defDept)
  }

  return orgId
}
