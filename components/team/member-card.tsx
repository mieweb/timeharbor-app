"use client"

import { Crown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User, Membership } from "@/lib/types"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface MemberCardProps {
  member: Membership & { user: User }
}

export function MemberCard({ member }: MemberCardProps) {
  const activeTimer = useAppStore((state) => state.activeTimer)
  const ticketsByTeam = useAppStore((state) => state.ticketsByTeam)

  // Check if this member has an active timer (simplified - in real app would need server data)
  const isOnline = false // Placeholder
  const initials = member.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="member-card flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <div className="member-card-avatar-wrapper relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={member.user.avatarUrl || "/placeholder.svg"} alt={member.user.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm">{initials}</AvatarFallback>
        </Avatar>
        {isOnline && (
          <span className="member-card-online-indicator absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-success" />
        )}
      </div>

      <div className="member-card-info flex-1 min-w-0">
        <div className="member-card-name-row flex items-center gap-2">
          <span className="member-card-name font-medium text-foreground truncate">{member.user.name}</span>
          {member.role === "owner" && <Crown className="member-card-owner-icon h-4 w-4 text-warning shrink-0" />}
        </div>
        <p className="member-card-email text-sm text-muted-foreground truncate">{member.user.email}</p>
      </div>

      <span
        className={cn(
          "member-card-role-badge shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
          member.role === "owner" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground",
        )}
      >
        {member.role === "owner" ? "Owner" : "Member"}
      </span>
    </div>
  )
}
