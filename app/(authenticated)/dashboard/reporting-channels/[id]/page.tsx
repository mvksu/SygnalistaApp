import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { reportingChannels } from "@/db/schema/reportingChannels"
import { reportingChannelAutoAssignments } from "@/db/schema/reportingChannels"
import { organizations } from "@/db/schema/organizations"
import { eq } from "drizzle-orm"
import Link from "next/link"
import { setChannelDefaultLanguage, deleteReportingChannelAction, addAutoAssignmentMember, removeAutoAssignmentMember } from "@/actions/reporting-channels"
import { CopyButton } from "@/components/ui/copy-button"
import { Link as LinkIcon, ExternalLink, Image as ImageIcon, Plus, X } from "lucide-react"
import { clerkClient } from "@clerk/nextjs/server"
import { Button } from "tweakcn/ui/button"
import PosterDialog from "@/components/poster-dialog"
import { orgMembers } from "@/db/schema/orgMembers"
import { users } from "@/db/schema/users"
import { asc } from "drizzle-orm"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default async function ReportingChannelDetail({ params }: { params: Promise<{ id: string }> }) {
	const { orgId: clerkOrgId } = await auth()
	if (!clerkOrgId) return null
	const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
	const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)

	const channel = await db.query.reportingChannels.findFirst({ where: eq(reportingChannels.id, (await params).id) })
	if (!channel || channel.orgId !== orgId) return null
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) })
  
  const cc = await clerkClient()
  const orgImg = await cc.organizations.getOrganization({
    organizationId: clerkOrgId
  })
  const orgImgUrl = orgImg.imageUrl

  const base = process.env.NEXT_PUBLIC_BASE_URL || ""
  const link = `${base}/secure/${channel.slug}`
  const QR = await import("qrcode")
  const qrDataUrl = await QR.toDataURL(link, { margin: 2, width: 600 })

  const members = await db
    .select({ id: orgMembers.id, role: orgMembers.role, name: users.name, email: users.email })
    .from(orgMembers)
    .innerJoin(users, eq(users.id, orgMembers.userId))
    .where(eq(orgMembers.orgId, orgId))
    .orderBy(asc(users.name))

  // Get auto-assigned members for this channel
  const autoAssignedMembers = await db
    .select({ 
      id: orgMembers.id, 
      role: orgMembers.role, 
      name: users.name, 
      email: users.email,
      assignmentId: reportingChannelAutoAssignments.id
    })
    .from(reportingChannelAutoAssignments)
    .innerJoin(orgMembers, eq(orgMembers.id, reportingChannelAutoAssignments.orgMemberId))
    .innerJoin(users, eq(users.id, orgMembers.userId))
    .where(eq(reportingChannelAutoAssignments.channelId, channel.id))
    .orderBy(asc(users.name))

  // Get available members (not yet auto-assigned)
  const availableMembers = members.filter(member => 
    !autoAssignedMembers.some(auto => auto.id === member.id)
  )

	return (
    <div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">{channel.name}</h1>
				<div className="flex items-center gap-2">
					<Link href="/dashboard/reporting-channels" className="text-sm text-muted-foreground">Back</Link>
				</div>
			</div>
        <div className="space-y-4">
          <div className="flex items-center gap-4 border-b">
            <Button className="border-b-2 border-primary font-medium" variant="link" size="sm">
              Links
            </Button>
            <Button className="text-muted-foreground" variant="link" size="sm" disabled>
              Phone hotline
            </Button>
            <Button className="text-muted-foreground" variant="link" size="sm" disabled>
              Email
            </Button>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded border p-4 space-y-3">
                    <div className="aspect-[4/3] w-full overflow-hidden rounded border">
                      <iframe src={`/reporting-channel/${channel.slug}`} className="h-full w-full" />
                    </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <LinkIcon className="h-4 w-4" />
                                <span>Open page</span>
                            </div>
                            <Link href={`/reporting-channel/${channel.slug}`} className="inline-flex items-center gap-1 rounded border px-2 py-1">
                                <ExternalLink className="h-4 w-4" />
                                <span>Open page</span>
                            </Link>
                        </div>
                    <div className="flex items-center justify-between text-sm">
                        <div className="text-muted-foreground">Poster promotion</div>
                        <PosterDialog orgName={org?.name ?? ""} orgLogoUrl={org?.logoUrl} link={link} qrDataUrl={qrDataUrl} />
                    </div>
                </div>
				<div className="space-y-6">
					<div className="rounded border">
						<div className="border-b p-4 font-medium">Customize your reporting channel</div>
						<div className="p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span>Organization logo</span>
              </div>
              <div className="flex items-center gap-2">
                {orgImgUrl ? (
                  <img src={orgImgUrl} alt="Organization logo" className="h-8 w-8 rounded object-cover" />
                ) : (
                  <span className="text-muted-foreground text-xs">No logo uploaded</span>
                )}
                <form action={async (formData: FormData) => {"use server"}} className="flex items-center gap-2">
                  <input type="file" name="logo" accept="image/*" className="text-xs" />
                  <Button type="submit" className="px-2 py-1" variant="primary" size="sm">
                    Upload
                  </Button>
                </form>
              </div>
            </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <LinkIcon className="h-4 w-4" />
                                <span>Reporting link</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono">/secure/{channel.slug}</span>
                                <CopyButton iconOnly className="rounded border px-2 py-1" text={`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/secure/${channel.slug}`} />
                            </div>
                        </div>
							<div className="flex items-center justify-between">
								<div className="text-muted-foreground">Default language</div>
                            <form action={setChannelDefaultLanguage} className="flex items-center gap-2">
                                <input type="hidden" name="id" value={channel.id} />
                                <select name="defaultLanguage" defaultValue={channel.defaultLanguage} className="rounded border px-2 py-1">
                                    <option value="auto">Auto detection</option>
                                    <option value="en">English</option>
                                    <option value="pl">Polski</option>
                                </select>
                                <Button type="submit" className="px-2 py-1" variant="primary" size="sm">
                                  Save
                                </Button>
                            </form>
							</div>
						</div>
					</div>
					<div className="rounded border">
						<div className="border-b p-4 font-medium">Link settings</div>
						<div className="p-4 space-y-3 text-sm">
							<div className="grid gap-2">
								<label className="text-muted-foreground">Name</label>
								<div>{channel.name}</div>
							</div>
							<div className="grid gap-2">
								<label className="text-muted-foreground">Link suffix</label>
								<div className="font-mono">{channel.slug}</div>
							</div>
                        <form action={deleteReportingChannelAction} className="pt-2">
                            <input type="hidden" name="id" value={channel.id} />
                            <Button type="submit" className="px-3 py-2 text-sm" variant="destructive" size="sm">
                              Delete channel
                            </Button>
                        </form>
						</div>
					</div>
          <div className="rounded border">
            <div className="border-b p-4 font-medium">Who has access</div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Auto-assigned members</h3>
                {availableMembers.length > 0 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-8 px-2">
                        <Plus className="h-4 w-4 mr-1" />
                        Add member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <h2 className="text-lg font-medium mb-4">Add auto-assignment member</h2>
                      <form action={addAutoAssignmentMember} className="space-y-4">
                        <input type="hidden" name="channelId" value={channel.id} />
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Select member</label>
                          <Select name="orgMemberId" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a member..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableMembers.map(member => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.name || member.email} ({member.role})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full">
                          Add member
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              {autoAssignedMembers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {autoAssignedMembers.map(member => (
                      <TableRow key={member.id}>
                        <TableCell>{member.name || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{member.email}</TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>
                          <form action={removeAutoAssignmentMember} className="inline">
                            <input type="hidden" name="channelId" value={channel.id} />
                            <input type="hidden" name="orgMemberId" value={member.id} />
                            <Button type="submit" variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <X className="h-4 w-4" />
                            </Button>
                          </form>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  No auto-assigned members. New cases will be assigned to the channel creator.
                </div>
              )}
              
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">All organization members</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Creator</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map(m => (
                      <TableRow key={m.id}>
                        <TableCell>{m.name || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{m.email}</TableCell>
                        <TableCell>{m.role}</TableCell>
                        <TableCell>{channel.createdByOrgMemberId === m.id ? "Yes" : "No"}</TableCell>
                      </TableRow>
                    ))}
                    {members.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-sm text-muted-foreground">No members found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
				</div>
		</div>
    </div>
	)
}


