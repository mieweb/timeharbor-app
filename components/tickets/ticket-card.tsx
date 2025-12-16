"use client"

import type React from "react"

import { Play, Square, MoreVertical, ChevronUp, ChevronDown, GripVertical, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Ticket } from "@/lib/types"
import { useTimer, formatDuration, formatDurationHuman } from "@/hooks/use-timer"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface TicketCardProps {
  ticket: Ticket
  todayMs?: number
  reorderable?: boolean
  index?: number
  totalCount?: number
}

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "in-progress": "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  archived: "bg-muted text-muted-foreground",
}

export function TicketCard({ ticket, todayMs = 0, reorderable = false, index = 0, totalCount = 0 }: TicketCardProps) {
  const { activeTimer, elapsedMs, startTimer } = useTimer()
  const showConfirm = useAppStore((state) => state.showConfirm)
  const updateTicket = useAppStore((state) => state.updateTicket)
  const reorderTicket = useAppStore((state) => state.reorderTicket)
  const isClockedIn = useAppStore((state) => state.isClockedIn)
  const clockedInTeamId = useAppStore((state) => state.clockedInTeamId)
  const showClockInPromptFor = useAppStore((state) => state.showClockInPromptFor)
  const showStopTimerPromptFor = useAppStore((state) => state.showStopTimerPromptFor)
  const stopTimer = useAppStore((state) => state.stopTimer)
  const showTicketNotes = useAppStore((state) => state.showTicketNotes)

  const isActiveTicket = activeTimer?.ticketId === ticket.id
  const isTimerRunning = !!activeTimer
  const isFirst = index === 0
  const isLast = index === totalCount - 1
  const notesCount = ticket.notes?.length || 0
  // Check if clocked into THIS ticket's team
  const isClockedInToTicketTeam = isClockedIn && clockedInTeamId === ticket.teamId

  const handleStopTimer = () => {
    showStopTimerPromptFor(ticket.id, ticket.title, (note: string) => {
      stopTimer(note)
    })
  }

  const handleToggleTimer = () => {
    if (isActiveTicket) {
      handleStopTimer()
    } else if (!isClockedInToTicketTeam) {
      // Not clocked into this ticket's team - show clock-in prompt
      showClockInPromptFor(ticket.teamId, ticket.id)
    } else if (isTimerRunning) {
      showConfirm(
        "Switch Timer?",
        "You have an active timer on another ticket. Starting this timer will stop the current one. Continue?",
        () => {
          // Stop the current timer with a prompt first
          showStopTimerPromptFor(activeTimer!.ticketId, "", (note: string) => {
            stopTimer(note)
            startTimer(ticket.id, ticket.title)
          })
        },
      )
    } else {
      startTimer(ticket.id, ticket.title)
    }
  }

  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation()
    reorderTicket(ticket.teamId, ticket.id, "up")
  }

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    reorderTicket(ticket.teamId, ticket.id, "down")
  }

  const displayTime = isActiveTicket ? todayMs + elapsedMs : todayMs

  return (
    <div
      className={cn(
        "ticket-card group rounded-xl border bg-card p-3 transition-all",
        isActiveTicket ? "border-primary shadow-sm shadow-primary/10" : "border-border hover:border-border/80",
      )}
    >
      <div className="ticket-card-header flex items-start gap-2">
        {reorderable && (
          <div className="ticket-card-reorder flex flex-col items-center gap-0.5 -ml-1">
            <GripVertical className="reorder-grip h-4 w-4 text-muted-foreground/50 hidden sm:block" />
            <Button
              variant="ghost"
              size="sm"
              className="reorder-up h-6 w-6 p-0 sm:hidden"
              onClick={handleMoveUp}
              disabled={isFirst}
            >
              <ChevronUp className="h-4 w-4" />
              <span className="sr-only">Move up</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="reorder-down h-6 w-6 p-0 sm:hidden"
              onClick={handleMoveDown}
              disabled={isLast}
            >
              <ChevronDown className="h-4 w-4" />
              <span className="sr-only">Move down</span>
            </Button>
          </div>
        )}

        <div className="ticket-card-content flex-1 min-w-0 flex flex-col gap-2">
          <h3 className="ticket-card-title font-medium text-foreground text-sm line-clamp-2 w-full">{ticket.title}</h3>

          <div className="ticket-card-actions-row flex items-center justify-between gap-2">
            <div className="ticket-card-status-row flex items-center gap-2">
              <span
                className={cn(
                  "ticket-status-badge shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                  statusColors[ticket.status],
                )}
              >
                {ticket.status.replace("-", " ")}
              </span>
              <button
                onClick={() => showTicketNotes(ticket.id)}
                className="ticket-notes-indicator flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] px-2 py-1 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">{notesCount}</span>
              </button>
            </div>

            <Button
              size="sm"
              variant={isActiveTicket ? "destructive" : "default"}
              className={cn(
                "ticket-card-timer-button h-8 gap-1.5 text-xs",
                !isActiveTicket && "bg-primary hover:bg-primary/90",
              )}
              onClick={handleToggleTimer}
            >
              {isActiveTicket ? (
                <>
                  <Square className="h-3 w-3" fill="currentColor" />
                  <span className="font-mono">{formatDuration(displayTime)}</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" fill="currentColor" />
                  {displayTime > 0 ? formatDurationHuman(displayTime) : "Start"}
                </>
              )}
            </Button>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="ticket-card-menu-trigger h-8 w-8 p-0 shrink-0">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => showTicketNotes(ticket.id)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Notes {notesCount > 0 && `(${notesCount})`}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => updateTicket(ticket.id, { status: "open" })}>
              Mark as Open
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateTicket(ticket.id, { status: "in-progress" })}>
              Mark as In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateTicket(ticket.id, { status: "completed" })}>
              Mark as Completed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
