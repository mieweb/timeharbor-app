"use client"

import { AlertTriangle } from "lucide-react"
import { Button, Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@mieweb/ui"
import { useAppStore } from "@/lib/store"

export function ConfirmDialog() {
  const showConfirmDialog = useAppStore((state) => state.showConfirmDialog)
  const hideConfirm = useAppStore((state) => state.hideConfirm)

  const handleConfirm = () => {
    showConfirmDialog.onConfirm?.()
    hideConfirm()
  }

  return (
    <Modal open={showConfirmDialog.open} onOpenChange={(open) => !open && hideConfirm()} size="sm">
      <ModalHeader>
        <ModalTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          {showConfirmDialog.title}
        </ModalTitle>
      </ModalHeader>
      <ModalBody>
        <p className="text-muted-foreground text-sm">{showConfirmDialog.message}</p>
      </ModalBody>
      <ModalFooter className="mt-4">
        <Button variant="outline" onClick={hideConfirm}>
          Cancel
        </Button>
        <Button onClick={handleConfirm}>Continue</Button>
      </ModalFooter>
    </Modal>
  )
}
