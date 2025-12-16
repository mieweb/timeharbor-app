"use client"

import { useState, useEffect, useCallback } from "react"
import { useAppStore } from "@/lib/store"

export function useTodayTotal(teamId?: string) {
  const activityLog = useAppStore((state) => state.activityLog)
  const isClockedIn = useAppStore((state) => state.isClockedIn)
  const clockedInAt = useAppStore((state) => state.clockedInAt)
  const currentTeamId = useAppStore((state) => state.currentTeamId)
  const [totalMs, setTotalMs] = useState(0)

  const filterTeamId = teamId ?? currentTeamId

  const calculateTotal = useCallback(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayMs = today.getTime()

    let total = 0

    for (const entry of activityLog) {
      const entryTime = new Date(entry.timestamp).getTime()
      // Only count clock-out entries for the current team
      const isTeamMatch = filterTeamId ? entry.teamId === filterTeamId : true
      if (entryTime >= todayMs && entry.type === "clock-out" && entry.durationMs && isTeamMatch) {
        total += entry.durationMs
      }
    }

    // Add current clocked-in time if applicable
    if (isClockedIn && clockedInAt) {
      const clockedInTime = new Date(clockedInAt).getTime()
      if (clockedInTime >= todayMs) {
        total += Date.now() - clockedInTime
      }
    }

    return total
  }, [activityLog, isClockedIn, clockedInAt, filterTeamId])

  useEffect(() => {
    // Initial calculation
    setTotalMs(calculateTotal())

    // Update every second if clocked in
    if (!isClockedIn) return

    const interval = setInterval(() => {
      setTotalMs(calculateTotal())
    }, 1000)

    return () => clearInterval(interval)
  }, [isClockedIn, calculateTotal])

  return totalMs
}
