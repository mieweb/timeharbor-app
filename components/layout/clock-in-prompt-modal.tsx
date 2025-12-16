"use client"

import { LogIn, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
    <Dialog open={showClockInPrompt.open} onOpenChange={(open) => !open && hideClockInPrompt()}>
      <DialogContent className="clock-in-prompt-modal sm:max-w-md">
        <DialogHeader className="clock-in-prompt-header">
          <div className="clock-in-prompt-icon mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="clock-in-prompt-title text-center">Clock In Required</DialogTitle>
          <DialogDescription className="clock-in-prompt-description text-center">
            You need to clock in before starting a timer on a ticket. Would you like to clock in now and start the
            timer?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="clock-in-prompt-actions flex-col gap-2 sm:flex-col">
          <Button onClick={handleClockInAndStart} className="clock-in-prompt-confirm w-full gap-2">
            <LogIn className="h-4 w-4" />
            Clock In & Start Timer
          </Button>
          <Button variant="outline" onClick={handleCancel} className="clock-in-prompt-cancel w-full bg-transparent">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
