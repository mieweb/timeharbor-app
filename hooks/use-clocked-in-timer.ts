"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"

export function useClockedInTimer(): number {
  const isClockedIn = useAppStore((state) => state.isClockedIn)
  const clockedInAt = useAppStore((state) => state.clockedInAt)
  const [elapsedMs, setElapsedMs] = useState(0)

  useEffect(() => {
    if (!isClockedIn || !clockedInAt) {
      setElapsedMs(0)
      return
    }

    const clockedInTime = new Date(clockedInAt).getTime()

    // Calculate initial elapsed time
    setElapsedMs(Date.now() - clockedInTime)

    // Update every second
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - clockedInTime)
    }, 1000)

    return () => clearInterval(interval)
  }, [isClockedIn, clockedInAt])

  return elapsedMs
}
