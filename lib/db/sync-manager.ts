// Simplified sync manager - manual sync only, IndexedDB is source of truth

import { db } from "./indexed-db"
import { getDataService } from "@/lib/services/data-service"
import { useAppStore } from "@/lib/store"

let isOnline = typeof navigator !== "undefined" ? navigator.onLine : true

// Initialize sync manager - just track online/offline status
export function initSyncManager() {
  if (typeof window === "undefined") return

  // Listen for online/offline events
  window.addEventListener("online", handleOnline)
  window.addEventListener("offline", handleOffline)

  // Set initial status
  updateSyncStatus(navigator.onLine ? "idle" : "offline")

  return () => {
    window.removeEventListener("online", handleOnline)
    window.removeEventListener("offline", handleOffline)
  }
}

function handleOnline() {
  isOnline = true
  updateSyncStatus("idle")
  // Note: No auto-sync, user must click "Sync Now"
}

function handleOffline() {
  isOnline = false
  updateSyncStatus("offline")
}

function updateSyncStatus(status: "idle" | "syncing" | "error" | "offline") {
  useAppStore.getState().setSyncStatus(status)
}

// Manual sync function - called only when user clicks "Sync Now"
export async function triggerSync() {
  if (!isOnline) {
    updateSyncStatus("offline")
    return
  }

  updateSyncStatus("syncing")
  console.log("[Sync] Manual sync triggered")

  try {
    const store = useAppStore.getState()
    const dataService = getDataService()
    const userId = store.user?.id
    const currentTeamId = store.currentTeamId

    if (!userId || !currentTeamId) {
      console.log("[Sync] No user or team, skipping")
      updateSyncStatus("idle")
      return
    }

    // 1. Push local activity log entries that are pending
    const localActivityLog = store.activityLog.filter(e => e.pendingSync)
    if (localActivityLog.length > 0) {
      console.log("[Sync] Pushing", localActivityLog.length, "activity entries")
      for (const entry of localActivityLog) {
        await dataService.activityLog.create({
          id: entry.id,
          userId: entry.userId,
          teamId: entry.teamId,
          type: entry.type,
          timestamp: entry.timestamp,
          ticketId: entry.ticketId,
          ticketTitle: entry.ticketTitle,
          durationMs: entry.durationMs,
          note: entry.note,
          pendingSync: false,
        })
      }
      
      // Mark as synced locally
      const syncedLog = store.activityLog.map(e => 
        e.pendingSync ? { ...e, pendingSync: false } : e
      )
      store.setActivityLog(syncedLog)
      await db.activityLog.putMany(syncedLog)
    }

    // 2. Pull fresh tickets from server
    console.log("[Sync] Pulling tickets for team", currentTeamId)
    const serverTickets = await dataService.tickets.list(currentTeamId)
    
    // Merge with local tickets (preserve local notes)
    const localTickets = store.ticketsByTeam[currentTeamId] || []
    const mergedTickets = serverTickets.map(serverTicket => {
      const localTicket = localTickets.find(t => t.id === serverTicket.id)
      if (localTicket?.notes && localTicket.notes.length > 0) {
        return { ...serverTicket, notes: localTicket.notes }
      }
      return serverTicket
    })
    
    store.setTickets(currentTeamId, mergedTickets)
    await db.tickets.putMany(mergedTickets)

    // 3. Pull time entries
    const timeEntries = await dataService.time.list(userId, currentTeamId)
    store.setTimeEntries(timeEntries)
    await db.timeEntries.putMany(timeEntries)

    // 4. Pull assignments
    const assignments = await dataService.assignments.list(currentTeamId)
    store.setAssignments(currentTeamId, assignments)
    await db.assignments.putMany(assignments)

    // 5. Pull members
    const members = await dataService.members.list(currentTeamId)
    store.setMembers(currentTeamId, members)

    // Done
    updateSyncStatus("idle")
    store.setLastSyncedAt(new Date().toISOString())
    await db.metadata.set("lastSyncedAt", new Date().toISOString())
    console.log("[Sync] Sync completed successfully")
    
  } catch (error) {
    console.error("[Sync] Sync failed:", error)
    updateSyncStatus("error")
  }
}

// Legacy export for compatibility - no longer does anything
// Data is persisted directly to IndexedDB by store actions
export async function queueForSync() {
  // No-op: sync only happens when user clicks "Sync Now"
}
