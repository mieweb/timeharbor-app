"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"

export function useTodayTotal() {
  const getTodayTotalMs = useAppStore((state) => state.getTodayTotalMs)
  const isClockedIn = useAppStore((state) => state.isClockedIn)
  const [totalMs, setTotalMs] = useState(0)

  useEffect(() => {
    // Initial calculation
    setTotalMs(getTodayTotalMs())

    // Update every second if clocked in
    if (!isClockedIn) return

    const interval = setInterval(() => {
      setTotalMs(getTodayTotalMs())
    }, 1000)

    return () => clearInterval(interval)
  }, [isClockedIn, getTodayTotalMs])

  return totalMs
}
