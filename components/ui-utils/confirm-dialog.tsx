"use client"

import { AlertTriangle } from "lucide-react"
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

export function ConfirmDialog() {
  const showConfirmDialog = useAppStore((state) => state.showConfirmDialog)
  const hideConfirm = useAppStore((state) => state.hideConfirm)

  const handleConfirm = () => {
    showConfirmDialog.onConfirm?.()
    hideConfirm()
  }

  return (
    <Dialog open={showConfirmDialog.open} onOpenChange={(open) => !open && hideConfirm()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            {showConfirmDialog.title}
          </DialogTitle>
          <DialogDescription>{showConfirmDialog.message}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={hideConfirm}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
