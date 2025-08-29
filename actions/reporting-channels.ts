"use server"

import { db } from "@/db"
import { reportingChannels, reportingChannelAutoAssignments } from "@/db/schema/reportingChannels"
import { orgMembers } from "@/db/schema/orgMembers"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireOrgAndRole } from "@/lib/authz"
import { writeAudit, getCurrentActorOrgMemberId } from "@/src/server/services/audit"

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

export async function addAutoAssignmentMember(formData: FormData) {
	const { userId, orgId } = await requireOrgAndRole({ allowed: ["ADMIN", "HANDLER"] })
	
	const channelId = formData.get("channelId") as string
	const orgMemberId = formData.get("orgMemberId") as string
	
	if (!channelId || !orgMemberId) {
		throw new Error("Missing required fields")
	}
	
	// Verify the channel belongs to the user's organization
	const channel = await db.query.reportingChannels.findFirst({
		where: eq(reportingChannels.id, channelId)
	})
	
	if (!channel || channel.orgId !== orgId) {
		throw new Error("Channel not found")
	}
	
	// Verify the org member belongs to the same organization
	const member = await db.query.orgMembers.findFirst({
		where: eq(orgMembers.id, orgMemberId)
	})
	
	if (!member || member.orgId !== orgId) {
		throw new Error("Member not found")
	}
	
	// Check if assignment already exists
	const existing = await db.query.reportingChannelAutoAssignments.findFirst({
		where: and(
			eq(reportingChannelAutoAssignments.channelId, channelId),
			eq(reportingChannelAutoAssignments.orgMemberId, orgMemberId)
		)
	})
	
	if (existing) {
		throw new Error("Member is already auto-assigned to this channel")
	}
	
	// Add the auto-assignment
	await db.insert(reportingChannelAutoAssignments).values({
		channelId,
		orgMemberId
	})
	
	// Audit: record auto-assignment member addition
	try {
		const { orgMemberId: actorId } = await getCurrentActorOrgMemberId()
		await writeAudit({
			orgId,
			actorId,
			action: "AUTO_ASSIGNMENT_ADDED",
			targetType: "reporting_channel",
			targetId: channelId,
		})
	} catch (error) {
		console.error("Failed to audit auto-assignment addition:", error)
	}
	
	revalidatePath(`/dashboard/reporting-channels/${channelId}`)
}

export async function removeAutoAssignmentMember(formData: FormData) {
	const { userId, orgId } = await requireOrgAndRole({ allowed: ["ADMIN", "HANDLER"] })
	
	const channelId = formData.get("channelId") as string
	const orgMemberId = formData.get("orgMemberId") as string
	
	if (!channelId || !orgMemberId) {
		throw new Error("Missing required fields")
	}
	
	// Verify the channel belongs to the user's organization
	const channel = await db.query.reportingChannels.findFirst({
		where: eq(reportingChannels.id, channelId)
	})
	
	if (!channel || channel.orgId !== orgId) {
		throw new Error("Channel not found")
	}
	
	// Get member info for audit
	const member = await db.query.orgMembers.findFirst({
		where: eq(orgMembers.id, orgMemberId)
	})
	
	// Remove the auto-assignment
	await db.delete(reportingChannelAutoAssignments)
		.where(and(
			eq(reportingChannelAutoAssignments.channelId, channelId),
			eq(reportingChannelAutoAssignments.orgMemberId, orgMemberId)
		))
	
	// Audit: record auto-assignment member removal
	try {
		const { orgMemberId: actorId } = await getCurrentActorOrgMemberId()
		await writeAudit({
			orgId,
			actorId,
			action: "AUTO_ASSIGNMENT_REMOVED",
			targetType: "reporting_channel",
			targetId: channelId,
		})
	} catch (error) {
		console.error("Failed to audit auto-assignment removal:", error)
	}
	
	revalidatePath(`/dashboard/reporting-channels/${channelId}`)
}


