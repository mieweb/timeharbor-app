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
        const [cachedTeams, cachedMemberships, cachedTimeEntries, cachedActivityLog, lastSynced, clockedInState, activeTimerState] = await Promise.all([
          db.teams.getAll(),
          db.memberships.getAll(),
          db.timeEntries.getAll(),
          db.activityLog.getAll(),
          db.metadata.get<string>("lastSyncedAt"),
          db.metadata.get<{ isClockedIn: boolean; clockedInAt: string | null; clockedInTeamId: string | null }>("clockedInState"),
          db.metadata.get<{ teamId: string; ticketId: string; timeEntryId: string; startedAt: string } | null>("activeTimer"),
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

        // Restore clocked in state
        if (clockedInState) {
          useAppStore.setState({ 
            isClockedIn: clockedInState.isClockedIn,
            clockedInAt: clockedInState.clockedInAt,
            clockedInTeamId: clockedInState.clockedInTeamId ?? null,
          })
        }

        // Restore active timer state
        if (activeTimerState) {
          // Recalculate localClockStart based on time elapsed since startedAt
          const startedAtMs = new Date(activeTimerState.startedAt).getTime()
          const elapsedSinceStart = Date.now() - startedAtMs
          useAppStore.setState({
            activeTimer: {
              teamId: activeTimerState.teamId,
              ticketId: activeTimerState.ticketId,
              timeEntryId: activeTimerState.timeEntryId,
              startedAt: activeTimerState.startedAt,
              localClockStart: Date.now() - elapsedSinceStart,
            },
          })
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

  // Persist clocked in state when it changes (skip initial mount before persistence loads)
  const isClockedIn = useAppStore((state) => state.isClockedIn)
  const clockedInAt = useAppStore((state) => state.clockedInAt)
  const clockedInTeamId = useAppStore((state) => state.clockedInTeamId)
  const persistenceLoaded = useAppStore((state) => state.persistenceLoaded)
  useEffect(() => {
    // Don't persist until we've loaded existing data
    if (!persistenceLoaded) return
    db.metadata.set("clockedInState", { isClockedIn, clockedInAt, clockedInTeamId }).catch(console.error)
  }, [isClockedIn, clockedInAt, clockedInTeamId, persistenceLoaded])

  // Persist active timer state when it changes (skip initial mount before persistence loads)
  const activeTimer = useAppStore((state) => state.activeTimer)
  useEffect(() => {
    // Don't persist until we've loaded existing data
    if (!persistenceLoaded) return
    if (activeTimer) {
      // Only persist the parts we need (exclude localClockStart which is recalculated on restore)
      db.metadata.set("activeTimer", {
        teamId: activeTimer.teamId,
        ticketId: activeTimer.ticketId,
        timeEntryId: activeTimer.timeEntryId,
        startedAt: activeTimer.startedAt,
      }).catch(console.error)
    } else {
      // Clear the active timer from storage
      db.metadata.set("activeTimer", null).catch(console.error)
    }
  }, [activeTimer, persistenceLoaded])

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
