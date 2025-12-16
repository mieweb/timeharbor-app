"use client"

import { useRouter } from "next/navigation"
import { Check, Users, Clock } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function TeamSwitcherModal() {
  const router = useRouter()
  const showTeamSwitcher = useAppStore((state) => state.showTeamSwitcher)
  const setShowTeamSwitcher = useAppStore((state) => state.setShowTeamSwitcher)
  const teams = useAppStore((state) => state.teams)
  const currentTeamId = useAppStore((state) => state.currentTeamId)
  const setCurrentTeam = useAppStore((state) => state.setCurrentTeam)
  const memberships = useAppStore((state) => state.memberships)
  const user = useAppStore((state) => state.user)
  const isClockedIn = useAppStore((state) => state.isClockedIn)
  const clockedInTeamId = useAppStore((state) => state.clockedInTeamId)
  const addToast = useAppStore((state) => state.addToast)

  const clockedInTeam = teams.find((t) => t.id === clockedInTeamId)

  const handleSelectTeam = (teamId: string) => {
    // If switching away from the team where user is clocked in, show a warning
    if (isClockedIn && clockedInTeamId && teamId !== clockedInTeamId) {
      addToast(`You're still clocked in to ${clockedInTeam?.name || "another team"}`, "warning")
    }
    setCurrentTeam(teamId)
    setShowTeamSwitcher(false)
    router.push(`/team/${teamId}/dashboard`)
  }

  const getRoleForTeam = (teamId: string) => {
    if (!user) return null
    return memberships.find((m) => m.teamId === teamId && m.userId === user.id)?.role
  }

  return (
    <Dialog open={showTeamSwitcher} onOpenChange={setShowTeamSwitcher}>
      <DialogContent className="modal-team-switcher sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="modal-team-switcher-header flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Select Team
          </DialogTitle>
          <DialogDescription>
            Choose which team you want to work with. You can only be active in one team at a time.
          </DialogDescription>
        </DialogHeader>

        {/* Clocked-in warning */}
        {isClockedIn && clockedInTeamId && (
          <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
            <Clock className="h-4 w-4 text-warning shrink-0" />
            <span className="text-warning">
              You're clocked in to <strong>{clockedInTeam?.name}</strong>
            </span>
          </div>
        )}

        <div className="team-switcher-list mt-4 space-y-2">
          {teams.map((team) => {
            const isSelected = team.id === currentTeamId
            const isClockedInToThisTeam = clockedInTeamId === team.id
            const role = getRoleForTeam(team.id)

            return (
              <button
                key={team.id}
                onClick={() => handleSelectTeam(team.id)}
                className={cn(
                  "team-switcher-item flex w-full items-center justify-between rounded-lg border p-4 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-secondary/50",
                )}
              >
                <div className="team-switcher-item-content flex flex-col gap-1">
                  <span className="team-switcher-item-name font-medium text-foreground flex items-center gap-2">
                    {team.name}
                    {isClockedInToThisTeam && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
                        <Clock className="h-2.5 w-2.5" />
                        Clocked In
                      </span>
                    )}
                  </span>
                  {team.description && (
                    <span className="team-switcher-item-description text-sm text-muted-foreground">
                      {team.description}
                    </span>
                  )}
                  {role && (
                    <span
                      className={cn(
                        "team-switcher-item-role mt-1 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        role === "owner" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {role === "owner" ? "Owner" : "Member"}
                    </span>
                  )}
                </div>
                {isSelected && <Check className="team-switcher-item-check h-5 w-5 text-primary" />}
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
