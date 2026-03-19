"use client"

import { LogIn, Clock } from "lucide-react"
import { Button, Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@mieweb/ui"
import { useAppStore } from "@/lib/store"

export function ClockInPromptModal() {
  const showClockInPrompt = useAppStore((state) => state.showClockInPrompt)
  const hideClockInPrompt = useAppStore((state) => state.hideClockInPrompt)
  const clockInAndStartTimer = useAppStore((state) => state.clockInAndStartTimer)
  const ticketsByTeam = useAppStore((state) => state.ticketsByTeam)

  const handleClockInAndStart = () => {
    if (showClockInPrompt.pendingTeamId && showClockInPrompt.pendingTicketId) {
      const tickets = ticketsByTeam[showClockInPrompt.pendingTeamId]
      const ticket = tickets?.find(
        (t) => t.id === showClockInPrompt.pendingTicketId,
      )
      clockInAndStartTimer(
        showClockInPrompt.pendingTeamId,
        showClockInPrompt.pendingTicketId,
        ticket?.title || "Unknown Ticket"
      )
    }
    hideClockInPrompt()
  }

  const handleCancel = () => {
    hideClockInPrompt()
  }

  return (
    <Modal open={showClockInPrompt.open} onOpenChange={(open) => !open && hideClockInPrompt()} size="sm">
      <ModalHeader className="clock-in-prompt-header">
        <div className="clock-in-prompt-icon mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Clock className="h-6 w-6 text-primary" />
        </div>
        <ModalTitle className="clock-in-prompt-title text-center">Clock In Required</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <p className="clock-in-prompt-description text-center text-muted-foreground text-sm">
          You need to clock in before starting a timer on a ticket. Would you like to clock in now and start the
          timer?
        </p>
      </ModalBody>
      <ModalFooter className="clock-in-prompt-actions flex-col gap-2 sm:flex-col">
        <Button onClick={handleClockInAndStart} className="clock-in-prompt-confirm w-full gap-2">
          <LogIn className="h-4 w-4" />
          Clock In & Start Timer
        </Button>
        <Button variant="outline" onClick={handleCancel} className="clock-in-prompt-cancel w-full bg-transparent">
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}
