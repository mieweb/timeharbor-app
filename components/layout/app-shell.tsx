"use client"

import type React from "react"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { HeaderClockStatus } from "./header-clock-status"
import { FooterNav } from "./footer-nav"
import { ClockInPromptModal } from "./clock-in-prompt-modal"
import { TeamSwitcherModal } from "../team/team-switcher-modal"
import { AddTicketModal } from "../tickets/add-ticket-modal"
import { StopTimerModal } from "../tickets/stop-timer-modal"
import { TicketNotesModal } from "../tickets/ticket-notes-modal"
import { ConfirmDialog } from "../ui-utils/confirm-dialog"
import { ToastContainer } from "../ui-utils/toast-container"
import { useAppStore } from "@/lib/store"
import { getDataService } from "@/lib/services/data-service"
import { usePersistence } from "@/hooks/use-persistence"
import { OzwellChat } from "@ozwell/react"
import type { OzwellTool } from "@ozwell/react"

// Define tools for TimeHarbor integration
const tools: OzwellTool[] = [
  {
    type: "function",
    function: {
      name: "get_current_user",
      description: "Get current user's profile (name, email, ID). Use for identity questions.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_active_timer",
      description: "Check if a timer is running and get elapsed time. Use for 'what am I working on' questions.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tickets",
      description: "List tickets/tasks. Use for any ticket-related query. Default: returns all tickets.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max tickets to return (default: 10)" },
          status: { type: "string", enum: ["open", "in-progress", "completed", "all"], description: "Filter by status (default: all)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_clock_status",
      description: "Get clock-in status and today's total work hours.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "create_ticket",
      description: "Create a new ticket in the current team.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Ticket title (required)" },
          description: { type: "string", description: "Ticket description" },
          status: { type: "string", enum: ["open", "in-progress", "completed"], description: "Initial status (default: open)" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_ticket",
      description: "Update a ticket's title, description, status, or add a note. Get ticket_id from get_tickets first.",
      parameters: {
        type: "object",
        properties: {
          ticket_id: { type: "string", description: "Ticket ID (required)" },
          title: { type: "string", description: "New title" },
          description: { type: "string", description: "New description" },
          status: { type: "string", enum: ["open", "in-progress", "completed"], description: "New status" },
          note: { type: "string", description: "Note to add" },
        },
        required: ["ticket_id"],
      },
    },
  },
]

interface AppShellProps {
  children: React.ReactNode
}

// Helper to format milliseconds as human-readable duration
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const setAuth = useAppStore((state) => state.setAuth)
  const setTeams = useAppStore((state) => state.setTeams)
  const setCurrentTeam = useAppStore((state) => state.setCurrentTeam)
  const currentTeamId = useAppStore((state) => state.currentTeamId)
  const setShowTeamSwitcher = useAppStore((state) => state.setShowTeamSwitcher)

  // Get store data for tool handlers
  const user = useAppStore((state) => state.user)
  const activeTimer = useAppStore((state) => state.activeTimer)
  const isClockedIn = useAppStore((state) => state.isClockedIn)
  const clockedInAt = useAppStore((state) => state.clockedInAt)
  const ticketsByTeam = useAppStore((state) => state.ticketsByTeam)
  const getTodayTotalMs = useAppStore((state) => state.getTodayTotalMs)
  const getElapsedMs = useAppStore((state) => state.getElapsedMs)
  const addTicket = useAppStore((state) => state.addTicket)
  const updateTicket = useAppStore((state) => state.updateTicket)
  const addNoteToTicket = useAppStore((state) => state.addNoteToTicket)

  usePersistence()

  // Tool handlers - functions that return TimeHarbor data
  const handleToolCall = (tool: string, args: Record<string, unknown>, sendResult: (result: unknown) => void) => {
    console.log("[TimeHarbor] Received tool call:", tool, args)

    let result: unknown

    switch (tool) {
      case "get_current_user":
        if (!user) {
          result = { error: "No user logged in" }
        } else {
          result = {
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
          }
        }
        break

      case "get_active_timer":
        if (!activeTimer) {
          result = { active: false, message: "No timer currently running" }
        } else {
          const tickets = ticketsByTeam[activeTimer.teamId] || []
          const ticket = tickets.find((t) => t.id === activeTimer.ticketId)
          const elapsedMs = getElapsedMs()
          result = {
            active: true,
            ticketId: activeTimer.ticketId,
            ticketTitle: ticket?.title || "Unknown ticket",
            teamId: activeTimer.teamId,
            startedAt: activeTimer.startedAt,
            elapsedMs,
            elapsedFormatted: formatDuration(elapsedMs),
          }
        }
        break

      case "get_tickets": {
        const limit = (args.limit as number) || 10
        const statusFilter = (args.status as string) || "all"

        if (!currentTeamId) {
          result = { error: "No team selected" }
        } else {
          let tickets = ticketsByTeam[currentTeamId] || []
          if (statusFilter !== "all") {
            tickets = tickets.filter((t) => t.status === statusFilter)
          }
          result = tickets.slice(0, limit).map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            description: t.description,
            createdAt: t.createdAt,
            notesCount: t.notes?.length || 0,
          }))
        }
        break
      }

      case "get_clock_status": {
        const todayTotalMs = getTodayTotalMs()
        result = {
          isClockedIn,
          clockedInAt,
          clockedInDuration: clockedInAt ? formatDuration(Date.now() - new Date(clockedInAt).getTime()) : null,
          todayTotalMs,
          todayTotalFormatted: formatDuration(todayTotalMs),
        }
        break
      }

      case "create_ticket": {
        const title = args.title as string
        const description = args.description as string | undefined
        const status = (args.status as "open" | "in-progress" | "completed") || "open"

        if (!title) {
          result = { error: "Title is required to create a ticket" }
          break
        }

        if (!currentTeamId) {
          result = { error: "No team selected" }
          break
        }

        if (!user) {
          result = { error: "No user logged in" }
          break
        }

        const newTicket = {
          id: `ticket-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          teamId: currentTeamId,
          title,
          description,
          status,
          createdAt: new Date().toISOString(),
          createdBy: user.id,
          notes: [],
        }

        addTicket(newTicket)
        result = {
          success: true,
          message: "Ticket created successfully",
          ticket: {
            id: newTicket.id,
            title: newTicket.title,
            description: newTicket.description,
            status: newTicket.status,
          },
        }
        break
      }

      case "update_ticket": {
        const ticketId = args.ticket_id as string
        const newTitle = args.title as string | undefined
        const newDescription = args.description as string | undefined
        const newStatus = args.status as "open" | "in-progress" | "completed" | undefined
        const note = args.note as string | undefined

        if (!ticketId) {
          result = { error: "ticket_id is required to update a ticket" }
          break
        }

        if (!currentTeamId) {
          result = { error: "No team selected" }
          break
        }

        // Find the ticket
        const tickets = ticketsByTeam[currentTeamId] || []
        const existingTicket = tickets.find((t) => t.id === ticketId)

        if (!existingTicket) {
          result = { error: `Ticket with id "${ticketId}" not found` }
          break
        }

        // Build updates object
        const updates: Record<string, unknown> = {}
        if (newTitle !== undefined) updates.title = newTitle
        if (newDescription !== undefined) updates.description = newDescription
        if (newStatus !== undefined) updates.status = newStatus

        // Apply updates if any
        if (Object.keys(updates).length > 0) {
          updateTicket(ticketId, updates)
        }

        // Add note if provided
        if (note && note.trim()) {
          addNoteToTicket(ticketId, note.trim())
        }

        result = {
          success: true,
          message: "Ticket updated successfully",
          updated: {
            id: ticketId,
            ...(newTitle !== undefined && { title: newTitle }),
            ...(newDescription !== undefined && { description: newDescription }),
            ...(newStatus !== undefined && { status: newStatus }),
            ...(note && { noteAdded: note.trim() }),
          },
        }
        break
      }

      default:
        console.warn("[TimeHarbor] Unknown tool:", tool)
        result = { error: `Unknown tool: ${tool}` }
    }

    console.log("[TimeHarbor] Tool result:", result)
    sendResult(result)
  }

  // Initialize auth and teams on mount
  useEffect(() => {
    async function init() {
      const dataService = getDataService()
      const session = await dataService.auth.getSession()

      if (session) {
        setAuth(session.user, session.memberships)
        const userTeams = await dataService.teams.listForUser(session.user.id)
        setTeams(userTeams)

        // If multiple teams and no current team selected, show switcher
        if (userTeams.length > 1 && !currentTeamId) {
          setShowTeamSwitcher(true)
        } else if (userTeams.length === 1) {
          setCurrentTeam(userTeams[0].id)
        }
      }
    }

    init()
  }, [setAuth, setTeams, setCurrentTeam, currentTeamId, setShowTeamSwitcher])

  const isAuthPage = pathname === "/login" || pathname === "/register"

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-background">
      <HeaderClockStatus />

      <main className="app-main-content flex-1 overflow-y-auto pb-20 md:pb-6">
        <div className="app-main-container mx-auto max-w-4xl px-4 py-4">{children}</div>
      </main>

      <FooterNav />
      <TeamSwitcherModal />
      <AddTicketModal />
      <ClockInPromptModal />
      <StopTimerModal />
      <TicketNotesModal />
      <ConfirmDialog />
      <ToastContainer />
      <OzwellChat
        endpoint="https://ozwell-dev-refserver.opensource.mieweb.org/v1/chat/completions"
        widgetUrl="https://ozwell-dev-refserver.opensource.mieweb.org/embed/ozwell.html"
        tools={tools}
        debug={true}
        system="You are a helpful assistant for TimeHarbor, a time tracking app. Always use the tools to fetch data - never guess. For ticket questions, use get_tickets. For timer/current work questions, use get_active_timer. For clock-in/hours questions, use get_clock_status. For profile questions, use get_current_user. You can create and update tickets too."
        onReady={() => console.log("Ozwell chat ready!")}
        onToolCall={handleToolCall}
      />
    </div>
  )
}
