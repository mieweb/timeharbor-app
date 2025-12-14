"use client"

import { Square, Clock, ChevronDown, Users, Cloud, CloudOff, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { useTimer, formatDuration } from "@/hooks/use-timer"
import { useClockedInTimer } from "@/hooks/use-clocked-in-timer"
import { useTodayTotal } from "@/hooks/use-today-total"
import { triggerSync } from "@/lib/db/sync-manager"
import { cn } from "@/lib/utils"

export function HeaderClockStatus() {
  const currentTeamId = useAppStore((state) => state.currentTeamId)
  const getCurrentTeam = useAppStore((state) => state.getCurrentTeam)
  const teams = useAppStore((state) => state.teams)
  const ticketsByTeam = useAppStore((state) => state.ticketsByTeam)
  const setShowTeamSwitcher = useAppStore((state) => state.setShowTeamSwitcher)
  const showConfirm = useAppStore((state) => state.showConfirm)
  const syncStatus = useAppStore((state) => state.syncStatus)
  const syncQueue = useAppStore((state) => state.syncQueue)
  const isClockedIn = useAppStore((state) => state.isClockedIn)
  const showStopTimerPromptFor = useAppStore((state) => state.showStopTimerPromptFor)
  const stopTimer = useAppStore((state) => state.stopTimer)

  const { activeTimer, elapsedMs, isRunning } = useTimer()
  const clockedInElapsedMs = useClockedInTimer()
  const todayTotalMs = useTodayTotal()

  const currentTeam = getCurrentTeam()
  const hasMultipleTeams = teams.length > 1

  // Get active ticket name
  const activeTicket = activeTimer
    ? ticketsByTeam[activeTimer.teamId]?.find((t) => t.id === activeTimer.ticketId)
    : null

  const handleTeamClick = () => {
    if (!hasMultipleTeams) return

    if (isRunning) {
      showConfirm(
        "Stop Timer?",
        "You have an active timer. Switching teams will stop the current timer. Continue?",
        () => {
          stopTimer()
          setShowTeamSwitcher(true)
        },
      )
    } else {
      setShowTeamSwitcher(true)
    }
  }

  const handleStopTimer = () => {
    if (activeTimer && activeTicket) {
      showStopTimerPromptFor(activeTimer.ticketId, activeTicket.title, (note: string) => {
        stopTimer(note)
      })
    }
  }

  const handleSyncClick = () => {
    if (syncStatus !== "syncing" && syncStatus !== "offline") {
      triggerSync()
    }
  }

  const SyncIcon = {
    idle: Cloud,
    syncing: Loader2,
    error: AlertCircle,
    offline: CloudOff,
  }[syncStatus]

  return (
    <header className="app-header sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="header-container mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <button
          onClick={handleTeamClick}
          disabled={!hasMultipleTeams}
          className={cn(
            "header-team-selector flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            hasMultipleTeams ? "hover:bg-secondary cursor-pointer" : "cursor-default",
          )}
        >
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="header-team-name max-w-[120px] truncate">{currentTeam?.name || "Select Team"}</span>
          {hasMultipleTeams && <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>

        <div className="header-right-section flex items-center gap-3">
          <button
            onClick={handleSyncClick}
            disabled={syncStatus === "syncing" || syncStatus === "offline"}
            className={cn(
              "header-sync-indicator flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
              syncStatus !== "syncing" && syncStatus !== "offline" && "hover:bg-secondary cursor-pointer",
            )}
            title={syncQueue.length > 0 ? `${syncQueue.length} pending changes` : "Synced"}
          >
            <SyncIcon
              className={cn(
                "h-3.5 w-3.5",
                syncStatus === "idle" && "text-success",
                syncStatus === "syncing" && "text-primary animate-spin",
                syncStatus === "error" && "text-destructive",
                syncStatus === "offline" && "text-warning",
              )}
            />
            {syncQueue.length > 0 && (
              <span className="header-sync-badge rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                {syncQueue.length}
              </span>
            )}
          </button>

          {/* Timer status */}
          {isRunning ? (
            <>
              <div className="timer-display flex flex-col items-end">
                <div className="timer-duration flex items-center gap-1.5">
                  <span className="timer-pulse-indicator relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  <span className="timer-value font-mono text-sm font-semibold text-foreground">
                    {formatDuration(elapsedMs)}
                  </span>
                </div>
                {activeTicket && (
                  <span className="timer-ticket-name hidden sm:block max-w-[140px] truncate text-xs text-muted-foreground">
                    {activeTicket.title}
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="btn-stop-timer h-8 w-8 p-0"
                onClick={handleStopTimer}
                aria-label="Stop timer"
              >
                <Square className="h-3.5 w-3.5" fill="currentColor" />
              </Button>
            </>
          ) : (
            <div className="timer-idle-status flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <div className="timer-status-text flex flex-col items-end">
                {isClockedIn ? (
                  <>
                    <span className="timer-session-time text-sm font-mono text-foreground">
                      {formatDuration(clockedInElapsedMs)}
                    </span>
                    <span className="timer-today-total text-[10px] text-muted-foreground">
                      Today: {formatDuration(todayTotalMs)}
                    </span>
                  </>
                ) : (
                  <span className="text-sm">Out</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
