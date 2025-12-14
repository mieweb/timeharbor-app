"use client"

// Hook for timer functionality with drift prevention

import { useEffect, useState, useCallback, useRef } from "react"
import { useAppStore } from "@/lib/store"

export function useTimer() {
  const activeTimer = useAppStore((state) => state.activeTimer)
  const startTimer = useAppStore((state) => state.startTimer)
  const stopTimer = useAppStore((state) => state.stopTimer)
  const currentTeamId = useAppStore((state) => state.currentTeamId)

  const [elapsedMs, setElapsedMs] = useState(0)
  const frameRef = useRef<number>()

  // Update elapsed time using requestAnimationFrame for smooth updates
  useEffect(() => {
    if (!activeTimer) {
      setElapsedMs(0)
      return
    }

    const updateElapsed = () => {
      const startTime = new Date(activeTimer.startedAt).getTime()
      setElapsedMs(Date.now() - startTime)
      frameRef.current = requestAnimationFrame(updateElapsed)
    }

    frameRef.current = requestAnimationFrame(updateElapsed)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [activeTimer])

  // Handle visibility change to correct for backgrounding
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && activeTimer) {
        const startTime = new Date(activeTimer.startedAt).getTime()
        setElapsedMs(Date.now() - startTime)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [activeTimer])

  const handleStartTimer = useCallback(
    (ticketId: string, ticketTitle?: string) => {
      if (!currentTeamId) return null
      return startTimer(currentTeamId, ticketId, ticketTitle || "Unknown Ticket")
    },
    [currentTeamId, startTimer],
  )

  const handleStopTimer = useCallback(() => {
    return stopTimer()
  }, [stopTimer])

  return {
    activeTimer,
    elapsedMs,
    isRunning: !!activeTimer,
    startTimer: handleStartTimer,
    stopTimer: handleStopTimer,
  }
}

// Format milliseconds to HH:MM:SS
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

// Format to human readable
export function formatDurationHuman(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m`
  }
  return "< 1m"
}
