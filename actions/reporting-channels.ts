"use server"

import { db } from "@/db"
import { reportingChannels } from "@/db/schema/reportingChannels"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function setChannelDefaultLanguage(formData: FormData) {
	const id = String(formData.get("id"))
	const defaultLanguage = String(formData.get("defaultLanguage"))
	await db.update(reportingChannels).set({ defaultLanguage }).where(eq(reportingChannels.id, id))
	revalidatePath(`/dashboard/reporting-channels/${id}`)
}

export async function deleteReportingChannelAction(formData: FormData) {
	const id = String(formData.get("id"))
	await db.delete(reportingChannels).where(eq(reportingChannels.id, id))
	revalidatePath("/dashboard/reporting-channels")
	redirect("/dashboard/reporting-channels")
}


