"use client"

import { useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TicketList } from "@/components/tickets/ticket-list"
import { ActivityLog } from "@/components/activity/activity-log"
import { useAppStore } from "@/lib/store"
import { getDataService } from "@/lib/services/data-service"

export default function DashboardPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const setCurrentTeam = useAppStore((state) => state.setCurrentTeam)
  const currentTeamId = useAppStore((state) => state.currentTeamId)
  const setShowAddTicketModal = useAppStore((state) => state.setShowAddTicketModal)
  const setTickets = useAppStore((state) => state.setTickets)
  const ticketsByTeam = useAppStore((state) => state.ticketsByTeam)
  const loadedRef = useRef(false)

  // Sync teamId from URL
  useEffect(() => {
    if (teamId && teamId !== currentTeamId) {
      setCurrentTeam(teamId)
    }
  }, [teamId, currentTeamId, setCurrentTeam])

  // Load tickets for team - merge with existing cached tickets to preserve notes
  useEffect(() => {
    if (!teamId || loadedRef.current) return

    async function loadData() {
      const dataService = getDataService()
      const freshTickets = await dataService.tickets.list(teamId)

      const cachedTickets = ticketsByTeam[teamId] || []
      const cachedNotesMap = new Map(cachedTickets.map((t) => [t.id, t.notes || []]))

      const mergedTickets = freshTickets.map((ticket) => ({
        ...ticket,
        notes: cachedNotesMap.get(ticket.id) || ticket.notes || [],
      }))

      setTickets(teamId, mergedTickets)
      loadedRef.current = true
    }

    loadData()
  }, [teamId, setTickets, ticketsByTeam])

  const tickets = ticketsByTeam[teamId] || []
  const openCount = tickets.filter((t) => t.status === "open").length
  const inProgressCount = tickets.filter((t) => t.status === "in-progress").length

  return (
    <div className="page-dashboard flex flex-col h-full">
      <div className="page-dashboard-header flex items-center justify-between py-2 px-1">
        <div className="page-dashboard-counts flex items-center gap-3 text-sm text-muted-foreground">
          <span className="count-badge count-badge--open flex items-center gap-1">
            <span className="count-value font-semibold text-foreground">{openCount}</span>
            <span>open</span>
          </span>
          <span className="count-separator text-border">•</span>
          <span className="count-badge count-badge--in-progress flex items-center gap-1">
            <span className="count-value font-semibold text-primary">{inProgressCount}</span>
            <span>in progress</span>
          </span>
        </div>

        <Button onClick={() => setShowAddTicketModal(true)} size="sm" className="btn-add-ticket h-8 w-8 p-0">
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add Ticket</span>
        </Button>
      </div>

      <div className="page-dashboard-tickets flex-1 min-h-0 overflow-y-auto">
        <TicketList filter="all" reorderable />
      </div>

      <div className="page-dashboard-activity border-t border-border bg-card/50 p-3 mt-auto">
        <ActivityLog />
      </div>
    </div>
  )
}
