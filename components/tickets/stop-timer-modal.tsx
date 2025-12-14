"use client"

import { useState, useEffect } from "react"
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
import { useAppStore } from "@/lib/store"
import { formatDuration } from "@/hooks/use-timer"

export function StopTimerModal() {
  const [note, setNote] = useState("")
  const [liveElapsedMs, setLiveElapsedMs] = useState(0)

  const showStopTimerPrompt = useAppStore((state) => state.showStopTimerPrompt)
  const hideStopTimerPrompt = useAppStore((state) => state.hideStopTimerPrompt)
  const activeTimer = useAppStore((state) => state.activeTimer)

  useEffect(() => {
    if (!showStopTimerPrompt.open || !activeTimer) {
      setLiveElapsedMs(0)
      return
    }

    const updateElapsed = () => {
      const elapsed = Date.now() - activeTimer.localClockStart
      setLiveElapsedMs(elapsed)
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)

    return () => clearInterval(interval)
  }, [showStopTimerPrompt.open, activeTimer])

  const handleSubmit = () => {
    if (showStopTimerPrompt.onConfirm) {
      showStopTimerPrompt.onConfirm(note.trim())
    }
    setNote("")
    hideStopTimerPrompt()
  }

  const handleSkip = () => {
    if (showStopTimerPrompt.onConfirm) {
      showStopTimerPrompt.onConfirm("")
    }
    setNote("")
    hideStopTimerPrompt()
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleSkip()
    }
  }

  return (
    <Dialog open={showStopTimerPrompt.open} onOpenChange={handleOpenChange}>
      <DialogContent className="stop-timer-modal sm:max-w-md">
        <DialogHeader className="stop-timer-modal-header">
          <DialogTitle className="stop-timer-modal-title">Stop Timer</DialogTitle>
          <DialogDescription className="stop-timer-modal-description">
            <span className="block font-medium text-foreground">{showStopTimerPrompt.ticketTitle}</span>
            <span className="block mt-1 font-mono text-lg">{formatDuration(liveElapsedMs)}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="stop-timer-modal-body py-2">
          <Textarea
            className="stop-timer-note-input min-h-[80px]"
            placeholder="Add a wrap-up note (optional)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter className="stop-timer-modal-footer gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleSkip} className="stop-timer-skip-button bg-transparent">
            Skip
          </Button>
          <Button onClick={handleSubmit} className="stop-timer-submit-button">
            Stop Timer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
