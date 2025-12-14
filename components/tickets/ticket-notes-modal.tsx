"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAppStore } from "@/lib/store"
import { MessageSquare, Send } from "lucide-react"

export function TicketNotesModal() {
  const [newNote, setNewNote] = useState("")
  const showTicketNotesModal = useAppStore((state) => state.showTicketNotesModal)
  const hideTicketNotes = useAppStore((state) => state.hideTicketNotes)
  const addNoteToTicket = useAppStore((state) => state.addNoteToTicket)
  const ticketsByTeam = useAppStore((state) => state.ticketsByTeam)

  // Find the ticket across all teams
  let ticket = null
  if (showTicketNotesModal.ticketId) {
    for (const teamId in ticketsByTeam) {
      const found = ticketsByTeam[teamId].find((t) => t.id === showTicketNotesModal.ticketId)
      if (found) {
        ticket = found
        break
      }
    }
  }

  const handleAddNote = () => {
    if (newNote.trim() && showTicketNotesModal.ticketId) {
      addNoteToTicket(showTicketNotesModal.ticketId, newNote.trim())
      setNewNote("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleAddNote()
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const notes = ticket?.notes || []

  return (
    <Dialog open={showTicketNotesModal.open} onOpenChange={(open) => !open && hideTicketNotes()}>
      <DialogContent className="ticket-notes-modal sm:max-w-lg">
        <DialogHeader className="ticket-notes-modal-header">
          <DialogTitle className="ticket-notes-modal-title flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notes
          </DialogTitle>
          <DialogDescription className="ticket-notes-modal-description line-clamp-1">
            {ticket?.title || "Ticket"}
          </DialogDescription>
        </DialogHeader>

        <div className="ticket-notes-modal-body flex flex-col gap-3">
          {notes.length > 0 ? (
            <ScrollArea className="ticket-notes-list h-[200px] pr-3">
              <div className="ticket-notes-items flex flex-col gap-2">
                {notes.map((note) => (
                  <div key={note.id} className="ticket-note-item rounded-lg border border-border bg-muted/30 p-3">
                    <p className="ticket-note-content text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                    <p className="ticket-note-date text-xs text-muted-foreground mt-2">{formatDate(note.createdAt)}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="ticket-notes-empty flex flex-col items-center justify-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notes yet</p>
            </div>
          )}

          <div className="ticket-notes-input-container flex gap-2">
            <Textarea
              className="ticket-notes-input min-h-[60px] flex-1"
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button
              size="icon"
              className="ticket-notes-send-button h-[60px] w-10 shrink-0"
              onClick={handleAddNote}
              disabled={!newNote.trim()}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Add note</span>
            </Button>
          </div>
        </div>

        <DialogFooter className="ticket-notes-modal-footer">
          <p className="text-xs text-muted-foreground">Press Cmd+Enter to add note</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
