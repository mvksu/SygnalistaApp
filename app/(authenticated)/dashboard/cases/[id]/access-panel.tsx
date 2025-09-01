import { db } from "@/db"
import { reportAssignees } from "@/db/schema/reportAssignees"
import { orgMembers } from "@/db/schema/orgMembers"
import { users } from "@/db/schema/users"
import { eq } from "drizzle-orm"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"

interface AccessPanelProps {
  reportId: string
}

export default async function AccessPanel({ reportId }: AccessPanelProps) {
  // Get all assigned members for this report
  const assignments = await db
    .select({
      reportId: reportAssignees.reportId,
      orgMemberId: reportAssignees.orgMemberId,
      addedAt: reportAssignees.addedAt,
      addedByOrgMemberId: reportAssignees.addedByOrgMemberId,
      // Member details
      memberRole: orgMembers.role,
      memberCreatedAt: orgMembers.createdAt,
      // User details
      userName: users.name,
      userEmail: users.email,
    })
    .from(reportAssignees)
    .leftJoin(orgMembers, eq(orgMembers.id, reportAssignees.orgMemberId))
    .leftJoin(users, eq(users.id, orgMembers.userId))
    .where(eq(reportAssignees.reportId, reportId))
    .orderBy(orgMembers.createdAt)

  // Get the "added by" information separately to avoid join conflicts
  const addedByInfo = new Map<string, { name: string; email: string }>()
  for (const assignment of assignments) {
    if (assignment.addedByOrgMemberId) {
      const [addedByMember] = await db
        .select({
          userName: users.name,
          userEmail: users.email,
        })
        .from(orgMembers)
        .leftJoin(users, eq(users.id, orgMembers.userId))
        .where(eq(orgMembers.id, assignment.addedByOrgMemberId))
      
      if (addedByMember && addedByMember.userEmail) {
        addedByInfo.set(assignment.orgMemberId, {
          name: addedByMember.userName || addedByMember.userEmail,
          email: addedByMember.userEmail
        })
      }
    }
  }

  if (assignments.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No members assigned to this case yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {assignments.map((assignment) => (
        <div key={assignment.orgMemberId} className="flex items-center gap-3 p-2 rounded-lg border">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback className="text-xs">
              {assignment.userName?.charAt(0)?.toUpperCase() || 
               assignment.userEmail?.charAt(0)?.toUpperCase() || 
               "?"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">
                {assignment.userName || assignment.userEmail}
              </span>
              <Badge variant="secondary" className="text-xs">
                {assignment.memberRole}
              </Badge>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Assigned {formatDistanceToNow(new Date(assignment.addedAt), { addSuffix: true })}
              {addedByInfo.get(assignment.orgMemberId) && (
                <span> by {addedByInfo.get(assignment.orgMemberId)?.name}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
