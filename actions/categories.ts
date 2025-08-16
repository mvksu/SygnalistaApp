"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { reportCategories } from "@/db/schema/reportCategories"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function addCategory(formData: FormData) {
	const { orgId: clerkOrgId } = await auth()
	if (!clerkOrgId) throw new Error("No org")
	const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
	const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)
	const name = String(formData.get("name") || "").trim()
	if (!name) return
	await db.insert(reportCategories).values({ orgId, name, active: true })
	revalidatePath("/dashboard/categories")
}

export async function setCategoryActive(id: string, active: boolean) {
	await db.update(reportCategories).set({ active }).where(eq(reportCategories.id, id))
	revalidatePath("/dashboard/categories")
}


