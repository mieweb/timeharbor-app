"use client"

import { useState } from "react"
import { UserPlus, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppStore } from "@/lib/store"
import { getDataService } from "@/lib/services/data-service"
import type { Assignment, User, Membership, Ticket } from "@/lib/types"

interface AssignmentPanelProps {
  ticket: Ticket
  assignments: Assignment[]
  members: (Membership & { user: User })[]
}

export function AssignmentPanel({ ticket, assignments, members }: AssignmentPanelProps) {
  const user = useAppStore((state) => state.user)
  const addAssignment = useAppStore((state) => state.addAssignment)
  const removeAssignment = useAppStore((state) => state.removeAssignment)
  const addToast = useAppStore((state) => state.addToast)

  const [selectedMember, setSelectedMember] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const ticketAssignments = assignments.filter((a) => a.ticketId === ticket.id)
  const assignedUserIds = ticketAssignments.map((a) => a.assigneeUserId)
  const availableMembers = members.filter((m) => !assignedUserIds.includes(m.userId))

  const handleAssign = async () => {
    if (!selectedMember || !user) return

    setIsLoading(true)
    try {
      const dataService = getDataService()
      const assignment = await dataService.assignments.create({
        teamId: ticket.teamId,
        ticketId: ticket.id,
        assigneeUserId: selectedMember,
        assignedBy: user.id,
      })
      addAssignment(assignment)
      setSelectedMember("")
      addToast("Member assigned successfully", "success")
    } catch {
      addToast("Failed to assign member", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const dataService = getDataService()
      await dataService.assignments.delete(assignmentId)
      removeAssignment(assignmentId)
      addToast("Assignment removed", "success")
    } catch {
      addToast("Failed to remove assignment", "error")
    }
  }

  return (
    <div className="assignment-panel space-y-3">
      <h4 className="assignment-panel-title text-sm font-medium text-foreground">Assigned Members</h4>

      {ticketAssignments.length > 0 ? (
        <div className="assignment-list space-y-2">
          {ticketAssignments.map((assignment) => {
            const member = members.find((m) => m.userId === assignment.assigneeUserId)
            if (!member) return null

            return (
              <div
                key={assignment.id}
                className="assignment-item flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
              >
                <span className="assignment-item-name text-sm font-medium">{member.user.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="assignment-item-remove-btn h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveAssignment(assignment.id)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove assignment</span>
                </Button>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="assignment-panel-empty text-sm text-muted-foreground">No members assigned yet.</p>
      )}

      {availableMembers.length > 0 && (
        <div className="assignment-add-form flex items-center gap-2">
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select member..." />
            </SelectTrigger>
            <SelectContent>
              {availableMembers.map((member) => (
                <SelectItem key={member.userId} value={member.userId}>
                  {member.user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAssign} disabled={!selectedMember || isLoading} className="btn-assign">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  )
}
