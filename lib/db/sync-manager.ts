// Background sync manager for offline-first functionality

import { db } from "./indexed-db"
import { getDataService } from "@/lib/services/data-service"
import { useAppStore } from "@/lib/store"
import type { SyncQueueItem, TimeEntry, Ticket } from "@/lib/types"

const SYNC_INTERVAL = 30000 // 30 seconds
const MAX_RETRIES = 5
const RETRY_BACKOFF_BASE = 1000 // 1 second

let syncInterval: NodeJS.Timeout | null = null
let isOnline = typeof navigator !== "undefined" ? navigator.onLine : true

// Initialize sync manager
export function initSyncManager() {
  if (typeof window === "undefined") return

  // Listen for online/offline events
  window.addEventListener("online", handleOnline)
  window.addEventListener("offline", handleOffline)

  // Set initial status
  updateSyncStatus(navigator.onLine ? "idle" : "offline")

  // Start periodic sync if online
  if (navigator.onLine) {
    startPeriodicSync()
  }

  return () => {
    window.removeEventListener("online", handleOnline)
    window.removeEventListener("offline", handleOffline)
    stopPeriodicSync()
  }
}

function handleOnline() {
  isOnline = true
  updateSyncStatus("idle")
  // Trigger immediate sync when coming back online
  triggerSync()
  startPeriodicSync()
}

function handleOffline() {
  isOnline = false
  updateSyncStatus("offline")
  stopPeriodicSync()
}

function startPeriodicSync() {
  if (syncInterval) return
  syncInterval = setInterval(triggerSync, SYNC_INTERVAL)
}

function stopPeriodicSync() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
}

function updateSyncStatus(status: "idle" | "syncing" | "error" | "offline") {
  useAppStore.getState().setSyncStatus(status)
}

// Main sync function
export async function triggerSync() {
  if (!isOnline) {
    updateSyncStatus("offline")
    return
  }

  const queue = await db.syncQueue.getAll()
  if (queue.length === 0) {
    // Even if queue is empty, pull latest data
    await pullFromServer()
    return
  }

  updateSyncStatus("syncing")

  try {
    // Process queue items one by one
    for (const item of queue) {
      await processQueueItem(item)
    }

    // After pushing, pull latest from server
    await pullFromServer()

    updateSyncStatus("idle")
    useAppStore.getState().setLastSyncedAt(new Date().toISOString())
    await db.metadata.set("lastSyncedAt", new Date().toISOString())
  } catch (error) {
    console.error("Sync failed:", error)
    updateSyncStatus("error")
  }
}

async function processQueueItem(item: SyncQueueItem) {
  const dataService = getDataService()

  try {
    switch (item.entity) {
      case "timeEntry":
        await processTimeEntrySync(item, dataService)
        break
      case "ticket":
        await processTicketSync(item, dataService)
        break
      case "assignment":
        await processAssignmentSync(item, dataService)
        break
    }

    // Remove from queue on success
    await db.syncQueue.remove(item.id)
    useAppStore.getState().removeFromSyncQueue(item.id)
  } catch (error) {
    // Increment retry count
    if (item.retryCount >= MAX_RETRIES) {
      // Max retries reached, remove from queue and log error
      console.error(`Sync item ${item.id} failed after ${MAX_RETRIES} retries:`, error)
      await db.syncQueue.remove(item.id)
      useAppStore.getState().removeFromSyncQueue(item.id)
    } else {
      // Update retry count with exponential backoff
      const updatedItem: SyncQueueItem = {
        ...item,
        retryCount: item.retryCount + 1,
      }
      await db.syncQueue.put(updatedItem)

      // Wait before next retry
      const backoffMs = RETRY_BACKOFF_BASE * Math.pow(2, item.retryCount)
      await new Promise((resolve) => setTimeout(resolve, backoffMs))
    }
  }
}

async function processTimeEntrySync(item: SyncQueueItem, dataService: ReturnType<typeof getDataService>) {
  const payload = item.payload as TimeEntry

  switch (item.type) {
    case "create":
      const created = await dataService.time.create({
        userId: payload.userId,
        teamId: payload.teamId,
        ticketId: payload.ticketId,
        start: payload.start,
        end: payload.end,
        durationMs: payload.durationMs,
        source: "local",
        pendingSync: false,
      })
      // Update local with server ID if different
      if (created.id !== payload.id) {
        await db.timeEntries.remove(payload.id)
        await db.timeEntries.put({ ...created, pendingSync: false })
      } else {
        await db.timeEntries.put({ ...payload, pendingSync: false })
      }
      break

    case "update":
      await dataService.time.update(payload.id, {
        end: payload.end,
        durationMs: payload.durationMs,
      })
      await db.timeEntries.put({ ...payload, pendingSync: false })
      break
  }
}

async function processTicketSync(item: SyncQueueItem, dataService: ReturnType<typeof getDataService>) {
  const payload = item.payload as Ticket

  switch (item.type) {
    case "create":
      const created = await dataService.tickets.create(payload.teamId, {
        title: payload.title,
        description: payload.description,
        status: payload.status,
        createdBy: payload.createdBy,
      })
      // Update local with server data
      if (created.id !== payload.id) {
        await db.tickets.remove(payload.id)
      }
      await db.tickets.put(created)
      break

    case "update":
      await dataService.tickets.update(payload.id, {
        title: payload.title,
        description: payload.description,
        status: payload.status,
      })
      break

    case "delete":
      await dataService.tickets.delete(payload.id)
      await db.tickets.remove(payload.id)
      break
  }
}

async function processAssignmentSync(item: SyncQueueItem, dataService: ReturnType<typeof getDataService>) {
  const payload = item.payload as {
    id: string
    teamId: string
    ticketId: string
    assigneeUserId: string
    assignedBy: string
  }

  switch (item.type) {
    case "create":
      await dataService.assignments.create({
        teamId: payload.teamId,
        ticketId: payload.ticketId,
        assigneeUserId: payload.assigneeUserId,
        assignedBy: payload.assignedBy,
      })
      break

    case "delete":
      await dataService.assignments.delete(payload.id)
      break
  }
}

// Pull latest data from server
async function pullFromServer() {
  if (!isOnline) return

  const store = useAppStore.getState()
  const currentTeamId = store.currentTeamId
  const userId = store.user?.id

  if (!currentTeamId || !userId) return

  const dataService = getDataService()
  const lastSyncedAt = await db.metadata.get("lastSyncedAt")

  try {
    // Pull tickets for current team
    const tickets = await dataService.tickets.list(currentTeamId)
    await db.tickets.putMany(tickets)
    store.setTickets(currentTeamId, tickets)

    // Pull time entries for user
    const timeEntries = await dataService.time.listForUser(userId, lastSyncedAt || undefined)

    // Merge with local entries (prefer server for non-pending items)
    const localEntries = await db.timeEntries.getByUser(userId)
    const pendingIds = new Set(localEntries.filter((e) => e.pendingSync).map((e) => e.id))

    const mergedEntries = [
      ...timeEntries.filter((e) => !pendingIds.has(e.id)),
      ...localEntries.filter((e) => e.pendingSync),
    ]

    await db.timeEntries.putMany(mergedEntries)
    store.setTimeEntries(mergedEntries)

    // Pull assignments
    const assignments = await dataService.assignments.list(currentTeamId)
    await db.assignments.putMany(assignments)
    store.setAssignments(currentTeamId, assignments)

    // Pull members
    const members = await dataService.members.list(currentTeamId)
    store.setMembers(currentTeamId, members)
  } catch (error) {
    console.error("Failed to pull from server:", error)
  }
}

// Add item to sync queue (called from store actions)
export async function queueForSync(
  type: "create" | "update" | "delete",
  entity: "timeEntry" | "ticket" | "assignment",
  payload: unknown,
) {
  const item: SyncQueueItem = {
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    entity,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  }

  await db.syncQueue.put(item)
  useAppStore.getState().addToSyncQueue(item)

  // Trigger sync if online
  if (isOnline) {
    // Debounce sync to batch multiple changes
    setTimeout(triggerSync, 1000)
  }
}
