"use client"

import type React from "react"

import { useEffect, useMemo, useState, useCallback } from "react"
import { TicketCard } from "./ticket-card"
import { EmptyTicketsState } from "./empty-tickets-state"
import { useAppStore } from "@/lib/store"
import { getDataService } from "@/lib/services/data-service"
import { cn } from "@/lib/utils"

interface TicketListProps {
  filter?: "all" | "open" | "in-progress" | "completed"
  reorderable?: boolean
}

export function TicketList({ filter = "all", reorderable = false }: TicketListProps) {
  const currentTeamId = useAppStore((state) => state.currentTeamId)
  const ticketsByTeam = useAppStore((state) => state.ticketsByTeam)
  const setTickets = useAppStore((state) => state.setTickets)
  const reorderTicketToIndex = useAppStore((state) => state.reorderTicketToIndex)
  const timeEntries = useAppStore((state) => state.timeEntries)
  const user = useAppStore((state) => state.user)

  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Load tickets for current team
  useEffect(() => {
    if (!currentTeamId) return

    async function loadTickets() {
      const dataService = getDataService()
      const tickets = await dataService.tickets.list(currentTeamId!)
      setTickets(currentTeamId!, tickets)
    }

    // Only load if we don't have tickets for this team yet
    if (!ticketsByTeam[currentTeamId]) {
      loadTickets()
    }
  }, [currentTeamId, setTickets, ticketsByTeam])

  const tickets = currentTeamId ? ticketsByTeam[currentTeamId] || [] : []

  // Filter tickets - for dashboard show only active (non-completed, non-archived)
  const filteredTickets = useMemo(() => {
    if (filter === "all") {
      return tickets.filter((t) => t.status !== "completed" && t.status !== "archived")
    }
    return tickets.filter((t) => t.status === filter)
  }, [tickets, filter])

  // Calculate today's time per ticket
  const todayTimeByTicket = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStart = today.getTime()

    const timeMap: Record<string, number> = {}

    timeEntries
      .filter((e) => e.userId === user?.id && new Date(e.start).getTime() >= todayStart)
      .forEach((entry) => {
        const duration = entry.durationMs || 0
        timeMap[entry.ticketId] = (timeMap[entry.ticketId] || 0) + duration
      })

    return timeMap
  }, [timeEntries, user?.id])

  // Drag handlers
  const handleDragStart = useCallback((ticketId: string) => {
    setDraggedId(ticketId)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (draggedId && dragOverIndex !== null && currentTeamId) {
      reorderTicketToIndex(currentTeamId, draggedId, dragOverIndex)
    }
    setDraggedId(null)
    setDragOverIndex(null)
  }, [draggedId, dragOverIndex, currentTeamId, reorderTicketToIndex])

  if (!currentTeamId) {
    return (
      <div className="ticket-list-no-team flex items-center justify-center py-12">
        <p className="text-muted-foreground">Please select a team to view tickets.</p>
      </div>
    )
  }

  if (filteredTickets.length === 0) {
    return <EmptyTicketsState filter={filter} />
  }

  return (
    <div className="ticket-list space-y-2">
      {filteredTickets.map((ticket, index) => (
        <div
          key={ticket.id}
          className={cn(
            "ticket-list-item",
            reorderable && "cursor-grab active:cursor-grabbing",
            draggedId === ticket.id && "opacity-50",
            dragOverIndex === index && draggedId !== ticket.id && "border-t-2 border-primary",
          )}
          draggable={reorderable}
          onDragStart={() => handleDragStart(ticket.id)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
        >
          <TicketCard
            ticket={ticket}
            todayMs={todayTimeByTicket[ticket.id] || 0}
            reorderable={reorderable}
            index={index}
            totalCount={filteredTickets.length}
          />
        </div>
      ))}
    </div>
  )
}
