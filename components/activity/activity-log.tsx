"use client"

import { Clock, LogIn, LogOut, Play, Square, MessageSquare, StickyNote, Cloud } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { formatDuration } from "@/hooks/use-timer"
import { useTodayTotal } from "@/hooks/use-today-total"
import { cn } from "@/lib/utils"
import type { ActivityLogEntry } from "@/lib/types"

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function ActivityLogItem({ entry }: { entry: ActivityLogEntry }) {
  const iconMap = {
    "clock-in": LogIn,
    "clock-out": LogOut,
    "timer-start": Play,
    "timer-stop": Square,
    "note-added": StickyNote,
  }

  const colorMap = {
    "clock-in": "text-success",
    "clock-out": "text-warning",
    "timer-start": "text-primary",
    "timer-stop": "text-muted-foreground",
    "note-added": "text-blue-500",
  }

  const labelMap = {
    "clock-in": "Clocked in",
    "clock-out": "Clocked out",
    "timer-start": "Started",
    "timer-stop": "Stopped",
    "note-added": "Note added",
  }

  const Icon = iconMap[entry.type]

  return (
    <div className={cn(
      "activity-log-item flex flex-col gap-1 py-2 border-b border-border last:border-0",
      entry.pendingSync && "pl-2 border-l-2 border-l-warning bg-warning/5"
    )}>
      <div className="activity-log-item-header flex items-center gap-3">
        <div className={`activity-log-icon flex-shrink-0 ${colorMap[entry.type]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="activity-log-content flex-1 min-w-0">
          <div className="activity-log-label flex items-center gap-2">
            <span className="activity-log-type text-sm font-medium text-foreground">{labelMap[entry.type]}</span>
            {entry.pendingSync && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                <Cloud className="h-2.5 w-2.5" />
                Local
              </span>
            )}
            {entry.ticketTitle && (
              <span className="activity-log-ticket text-sm text-muted-foreground truncate">- {entry.ticketTitle}</span>
            )}
          </div>
          <div className="activity-log-meta flex items-center gap-2 text-xs text-muted-foreground">
            <span className="activity-log-time">{formatTime(entry.timestamp)}</span>
            {entry.durationMs !== undefined && (
              <>
                <span className="activity-log-separator">•</span>
                <span className="activity-log-duration font-mono">{formatDuration(entry.durationMs)}</span>
              </>
            )}
          </div>
        </div>
      </div>
      {entry.note && (
        <div className="activity-log-note flex items-start gap-2 ml-7 mt-1 p-2 rounded-md bg-muted/50">
          <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="activity-log-note-text text-xs text-muted-foreground whitespace-pre-wrap">{entry.note}</p>
        </div>
      )}
    </div>
  )
}

export function ActivityLog({ teamId }: { teamId?: string }) {
  const activityLog = useAppStore((state) => state.activityLog)
  const currentTeamId = useAppStore((state) => state.currentTeamId)
  const todayTotalMs = useTodayTotal(teamId)

  const filterTeamId = teamId ?? currentTeamId

  // Filter to today's activities only, scoped to the current team
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayMs = today.getTime()

  const todayActivities = activityLog.filter((entry) => {
    const isToday = new Date(entry.timestamp).getTime() >= todayMs
    // Only show entries for this team
    const isTeamMatch = filterTeamId ? entry.teamId === filterTeamId : true
    return isToday && isTeamMatch
  })

  const sortedActivities = [...todayActivities].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  if (sortedActivities.length === 0) {
    return (
      <div className="activity-log-empty flex flex-col items-center justify-center py-8 text-center">
        <Clock className="h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="activity-log-empty-text text-sm text-muted-foreground">No activity today</p>
        <p className="activity-log-empty-hint text-xs text-muted-foreground/70">Clock in to start tracking</p>
      </div>
    )
  }

  return (
    <div className="activity-log">
      <div className="activity-log-header flex items-center justify-between pb-2 mb-2 border-b border-border">
        <div className="activity-log-header-left flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="activity-log-title text-sm font-medium text-foreground">Today&apos;s Activity</h3>
        </div>
        <div className="activity-log-header-right flex items-center gap-3">
          <span className="activity-log-total text-sm font-mono font-semibold text-foreground">
            {formatDuration(todayTotalMs)}
          </span>
          <span className="activity-log-count text-xs text-muted-foreground">
            ({sortedActivities.length} {sortedActivities.length === 1 ? "entry" : "entries"})
          </span>
        </div>
      </div>
      <div className="activity-log-list max-h-[200px] overflow-y-auto">
        {sortedActivities.map((entry) => (
          <ActivityLogItem key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}
