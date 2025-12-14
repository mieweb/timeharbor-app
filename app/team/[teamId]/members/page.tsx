"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { Users } from "lucide-react"
import { MemberCard } from "@/components/team/member-card"
import { AssignmentPanel } from "@/components/team/assignment-panel"
import { PermissionBoundary } from "@/components/ui-utils/permission-boundary"
import { MemberCardSkeleton } from "@/components/ui-utils/loading-skeleton"
import { useAppStore } from "@/lib/store"
import { getDataService } from "@/lib/services/data-service"

export default function MembersPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const setCurrentTeam = useAppStore((state) => state.setCurrentTeam)
  const currentTeamId = useAppStore((state) => state.currentTeamId)
  const getCurrentTeam = useAppStore((state) => state.getCurrentTeam)
  const membersByTeam = useAppStore((state) => state.membersByTeam)
  const setMembers = useAppStore((state) => state.setMembers)
  const assignmentsByTeam = useAppStore((state) => state.assignmentsByTeam)
  const setAssignments = useAppStore((state) => state.setAssignments)
  const ticketsByTeam = useAppStore((state) => state.ticketsByTeam)

  // Sync teamId from URL
  useEffect(() => {
    if (teamId && teamId !== currentTeamId) {
      setCurrentTeam(teamId)
    }
  }, [teamId, currentTeamId, setCurrentTeam])

  // Load members and assignments
  useEffect(() => {
    if (!teamId) return

    async function loadData() {
      const dataService = getDataService()
      const [members, assignments] = await Promise.all([
        dataService.members.list(teamId),
        dataService.assignments.list(teamId),
      ])
      setMembers(teamId, members)
      setAssignments(teamId, assignments)
    }

    if (!membersByTeam[teamId]) {
      loadData()
    }
  }, [teamId, setMembers, setAssignments, membersByTeam])

  const currentTeam = getCurrentTeam()
  const members = membersByTeam[teamId] || []
  const assignments = assignmentsByTeam[teamId] || []
  const tickets = ticketsByTeam[teamId] || []

  const owners = members.filter((m) => m.role === "owner")
  const regularMembers = members.filter((m) => m.role === "member")

  return (
    <div className="page-members space-y-6">
      <div className="page-members-header">
        <h1 className="page-members-title text-2xl font-bold text-foreground">Team Members</h1>
        <p className="page-members-subtitle text-muted-foreground">
          {members.length} member{members.length !== 1 ? "s" : ""} in {currentTeam?.name}
        </p>
      </div>

      {members.length === 0 ? (
        <div className="page-members-loading space-y-3">
          <MemberCardSkeleton />
          <MemberCardSkeleton />
          <MemberCardSkeleton />
        </div>
      ) : (
        <>
          {/* Owners */}
          {owners.length > 0 && (
            <div className="page-members-section page-members-section--owners space-y-3">
              <h2 className="section-label text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Owners
              </h2>
              {owners.map((member) => (
                <MemberCard key={member.userId} member={member} />
              ))}
            </div>
          )}

          {/* Members */}
          {regularMembers.length > 0 && (
            <div className="page-members-section page-members-section--members space-y-3">
              <h2 className="section-label text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Members
              </h2>
              {regularMembers.map((member) => (
                <MemberCard key={member.userId} member={member} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Assignment Panel - Owner Only */}
      <PermissionBoundary role="owner">
        <div className="page-members-assignments-section space-y-4">
          <h2 className="section-title text-lg font-semibold text-foreground">Work Assignments</h2>
          <p className="section-description text-sm text-muted-foreground">
            Assign team members to tickets. Only owners can manage assignments.
          </p>

          {tickets.filter((t) => t.status !== "completed").length > 0 ? (
            <div className="page-members-assignment-list space-y-4">
              {tickets
                .filter((t) => t.status !== "completed")
                .map((ticket) => (
                  <div
                    key={ticket.id}
                    className="page-members-assignment-card rounded-xl border border-border bg-card p-4"
                  >
                    <h3 className="page-members-assignment-card-title font-medium text-foreground">{ticket.title}</h3>
                    <div className="page-members-assignment-card-panel mt-3">
                      <AssignmentPanel ticket={ticket} assignments={assignments} members={members} />
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="page-members-empty-assignments rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No active tickets to assign.</p>
            </div>
          )}
        </div>
      </PermissionBoundary>
    </div>
  )
}
