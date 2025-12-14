"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TicketList } from "@/components/tickets/ticket-list"
import { useAppStore } from "@/lib/store"
import { getDataService } from "@/lib/services/data-service"

export default function TicketsPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const setCurrentTeam = useAppStore((state) => state.setCurrentTeam)
  const currentTeamId = useAppStore((state) => state.currentTeamId)
  const setShowAddTicketModal = useAppStore((state) => state.setShowAddTicketModal)
  const setTickets = useAppStore((state) => state.setTickets)
  const ticketsByTeam = useAppStore((state) => state.ticketsByTeam)
  const loadedRef = useRef(false)

  const [filter, setFilter] = useState<"all" | "open" | "in-progress" | "completed">("all")

  // Sync teamId from URL
  useEffect(() => {
    if (teamId && teamId !== currentTeamId) {
      setCurrentTeam(teamId)
    }
  }, [teamId, currentTeamId, setCurrentTeam])

  // Load tickets
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

  return (
    <div className="page-tickets space-y-6">
      <div className="page-tickets-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-tickets-header-info">
          <h1 className="page-tickets-title text-2xl font-bold text-foreground">Tickets</h1>
          <p className="page-tickets-subtitle text-muted-foreground">Manage and track your team's work</p>
        </div>

        <Button onClick={() => setShowAddTicketModal(true)} className="btn-add-ticket gap-2">
          <Plus className="h-4 w-4" />
          Add Ticket
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="page-tickets-tabs">
        <TabsList className="page-tickets-tabs-list w-full justify-start">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="page-tickets-tabs-content mt-4">
          <TicketList filter={filter} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
