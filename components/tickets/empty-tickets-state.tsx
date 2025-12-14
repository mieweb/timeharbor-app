"use client"

import { Ticket, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"

interface EmptyTicketsStateProps {
  filter?: string
}

export function EmptyTicketsState({ filter = "all" }: EmptyTicketsStateProps) {
  const setShowAddTicketModal = useAppStore((state) => state.setShowAddTicketModal)

  const message = filter === "all" ? "You don't have any tickets yet." : `No ${filter.replace("-", " ")} tickets found.`

  return (
    <div className="empty-tickets-state flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <div className="empty-tickets-icon-wrapper flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Ticket className="h-6 w-6 text-primary" />
      </div>
      <h3 className="empty-tickets-title mt-4 font-medium text-foreground">No tickets</h3>
      <p className="empty-tickets-message mt-1 text-sm text-muted-foreground">{message}</p>
      <Button className="empty-tickets-cta mt-4 gap-2" onClick={() => setShowAddTicketModal(true)}>
        <Plus className="h-4 w-4" />
        Add Ticket
      </Button>
    </div>
  )
}
