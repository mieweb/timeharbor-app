"use client"

import type React from "react"

import { useState } from "react"
import { Ticket, Loader2 } from "lucide-react"
import { Button, Input, Textarea, Select, Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@mieweb/ui"
import { useAppStore } from "@/lib/store"
import { getDataService } from "@/lib/services/data-service"
import { db } from "@/lib/db/indexed-db"
import { queueForSync } from "@/lib/db/sync-manager"
import type { TicketStatus, Ticket as TicketType } from "@/lib/types"

export function AddTicketModal() {
  const showAddTicketModal = useAppStore((state) => state.showAddTicketModal)
  const setShowAddTicketModal = useAppStore((state) => state.setShowAddTicketModal)
  const currentTeamId = useAppStore((state) => state.currentTeamId)
  const user = useAppStore((state) => state.user)
  const addTicket = useAppStore((state) => state.addTicket)
  const addToast = useAppStore((state) => state.addToast)
  const syncStatus = useAppStore((state) => state.syncStatus)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<TicketStatus>("open")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !currentTeamId || !user) return

    setIsLoading(true)

    try {
      const localTicket: TicketType = {
        id: `ticket-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        teamId: currentTeamId,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      }

      // Add to store immediately (optimistic update)
      addTicket(localTicket)

      // Persist to IndexedDB
      await db.tickets.put(localTicket)

      // Queue for sync if online, otherwise it will sync when back online
      if (syncStatus !== "offline") {
        const dataService = getDataService()
        try {
          const serverTicket = await dataService.tickets.create(currentTeamId, {
            title: localTicket.title,
            description: localTicket.description,
            status: localTicket.status,
            createdBy: localTicket.createdBy,
          })
          // Update local with server data
          await db.tickets.put(serverTicket)
        } catch {
          // Queue for later sync if server request fails
          await queueForSync("create", "ticket", localTicket)
        }
      } else {
        // Offline - queue for sync
        await queueForSync("create", "ticket", localTicket)
      }

      addToast("Ticket created successfully", "success")
      handleClose()
    } catch {
      addToast("Failed to create ticket", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setTitle("")
    setDescription("")
    setStatus("open")
    setShowAddTicketModal(false)
  }

  return (
    <Modal open={showAddTicketModal} onOpenChange={setShowAddTicketModal} size="sm">
      <ModalHeader>
        <ModalTitle className="modal-add-ticket-header flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          Add Ticket
        </ModalTitle>
      </ModalHeader>

      <ModalBody>
        <p className="text-muted-foreground text-sm">
          Create a new ticket to track your work.
          {syncStatus === "offline" && (
            <span className="modal-add-ticket-offline-warning block mt-1 text-warning">
              You're offline. Ticket will sync when back online.
            </span>
          )}
        </p>

        <form onSubmit={handleSubmit} className="form-add-ticket mt-4 space-y-4">
          <div className="form-field form-field--title space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter ticket title"
              required
            />
          </div>

          <div className="form-field form-field--description space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description (optional)</label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
            />
          </div>

          <div className="form-field form-field--status space-y-2">
            <Select
              label="Status"
              value={status}
              onValueChange={(v) => setStatus(v as TicketStatus)}
              options={[
                { value: "open", label: "Open" },
                { value: "in-progress", label: "In Progress" },
                { value: "completed", label: "Completed" },
              ]}
            />
          </div>

          <ModalFooter className="form-add-ticket-actions mt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Ticket
            </Button>
          </ModalFooter>
        </form>
      </ModalBody>
    </Modal>
  )
}
