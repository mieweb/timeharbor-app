"use client"

// Hook to initialize IndexedDB persistence and sync

import { useEffect, useRef } from "react"
import { db, initDB } from "@/lib/db/indexed-db"
import { initSyncManager, triggerSync } from "@/lib/db/sync-manager"
import { useAppStore } from "@/lib/store"

export function usePersistence() {
  const initialized = useRef(false)
  const setAuth = useAppStore((state) => state.setAuth)
  const setTeams = useAppStore((state) => state.setTeams)
  const setTickets = useAppStore((state) => state.setTickets)
  const setTimeEntries = useAppStore((state) => state.setTimeEntries)
  const setLastSyncedAt = useAppStore((state) => state.setLastSyncedAt)
  const currentTeamId = useAppStore((state) => state.currentTeamId)
  const user = useAppStore((state) => state.user)

  // Initialize IndexedDB and load cached data
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    async function init() {
      try {
        await initDB()

        // Load cached data from IndexedDB
        const [cachedTeams, cachedMemberships, cachedTimeEntries, cachedActivityLog, lastSynced] = await Promise.all([
          db.teams.getAll(),
          db.memberships.getAll(),
          db.timeEntries.getAll(),
          db.activityLog.getAll(),
          db.metadata.get("lastSyncedAt"),
        ])

        // Restore teams
        if (cachedTeams.length > 0) {
          setTeams(cachedTeams)
        }

        // Restore time entries
        if (cachedTimeEntries.length > 0) {
          setTimeEntries(cachedTimeEntries)
        }

        if (cachedActivityLog.length > 0) {
          useAppStore.setState({ activityLog: cachedActivityLog })
        }

        // Restore last synced timestamp
        if (lastSynced) {
          setLastSyncedAt(lastSynced)
        }

        // Mark persistence as loaded
        useAppStore.getState().setPersistenceLoaded(true)

        // Initialize sync manager
        const cleanup = initSyncManager()

        return cleanup
      } catch (error) {
        console.error("Failed to initialize persistence:", error)
      }
    }

    const cleanupPromise = init()

    return () => {
      cleanupPromise.then((cleanup) => cleanup?.())
    }
  }, [setAuth, setTeams, setTimeEntries, setLastSyncedAt])

  // Load team-specific data when team changes
  useEffect(() => {
    if (!currentTeamId) return

    async function loadTeamData() {
      try {
        const cachedTickets = await db.tickets.getByTeam(currentTeamId)
        if (cachedTickets.length > 0) {
          setTickets(currentTeamId, cachedTickets)
        }
      } catch (error) {
        console.error("Failed to load team data:", error)
      }
    }

    loadTeamData()
  }, [currentTeamId, setTickets])

  // Persist time entries when they change
  const timeEntries = useAppStore((state) => state.timeEntries)
  useEffect(() => {
    if (timeEntries.length > 0) {
      db.timeEntries.putMany(timeEntries).catch(console.error)
    }
  }, [timeEntries])

  // Persist teams when they change
  const teams = useAppStore((state) => state.teams)
  useEffect(() => {
    if (teams.length > 0) {
      db.teams.putMany(teams).catch(console.error)
    }
  }, [teams])

  const ticketsByTeam = useAppStore((state) => state.ticketsByTeam)
  useEffect(() => {
    const allTickets = Object.values(ticketsByTeam).flat()
    if (allTickets.length > 0) {
      db.tickets.putMany(allTickets).catch(console.error)
    }
  }, [ticketsByTeam])

  const activityLog = useAppStore((state) => state.activityLog)
  useEffect(() => {
    if (activityLog.length > 0) {
      db.activityLog.putMany(activityLog).catch(console.error)
    }
  }, [activityLog])

  return {
    triggerSync,
  }
}
