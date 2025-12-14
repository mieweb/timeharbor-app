// IndexedDB persistence layer for offline-first functionality

import type {
  User,
  Team,
  Membership,
  Ticket,
  TimeEntry,
  Assignment,
  SyncQueueItem,
  ActivityLogEntry,
} from "@/lib/types"

const DB_NAME = "time-harbor-db"
const DB_VERSION = 2

// Store names
const STORES = {
  users: "users",
  teams: "teams",
  memberships: "memberships",
  tickets: "tickets",
  timeEntries: "timeEntries",
  assignments: "assignments",
  syncQueue: "syncQueue",
  metadata: "metadata",
  activityLog: "activityLog",
} as const

type StoreName = (typeof STORES)[keyof typeof STORES]

let dbInstance: IDBDatabase | null = null

// Initialize the database
export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error("Failed to open IndexedDB:", request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Users store
      if (!db.objectStoreNames.contains(STORES.users)) {
        db.createObjectStore(STORES.users, { keyPath: "id" })
      }

      // Teams store
      if (!db.objectStoreNames.contains(STORES.teams)) {
        db.createObjectStore(STORES.teams, { keyPath: "id" })
      }

      // Memberships store
      if (!db.objectStoreNames.contains(STORES.memberships)) {
        const store = db.createObjectStore(STORES.memberships, { keyPath: ["userId", "teamId"] })
        store.createIndex("byUser", "userId", { unique: false })
        store.createIndex("byTeam", "teamId", { unique: false })
      }

      // Tickets store
      if (!db.objectStoreNames.contains(STORES.tickets)) {
        const store = db.createObjectStore(STORES.tickets, { keyPath: "id" })
        store.createIndex("byTeam", "teamId", { unique: false })
      }

      // Time entries store
      if (!db.objectStoreNames.contains(STORES.timeEntries)) {
        const store = db.createObjectStore(STORES.timeEntries, { keyPath: "id" })
        store.createIndex("byUser", "userId", { unique: false })
        store.createIndex("byTeam", "teamId", { unique: false })
        store.createIndex("byTicket", "ticketId", { unique: false })
        store.createIndex("pendingSync", "pendingSync", { unique: false })
      }

      // Assignments store
      if (!db.objectStoreNames.contains(STORES.assignments)) {
        const store = db.createObjectStore(STORES.assignments, { keyPath: "id" })
        store.createIndex("byTeam", "teamId", { unique: false })
        store.createIndex("byTicket", "ticketId", { unique: false })
      }

      // Sync queue store
      if (!db.objectStoreNames.contains(STORES.syncQueue)) {
        const store = db.createObjectStore(STORES.syncQueue, { keyPath: "id" })
        store.createIndex("byCreatedAt", "createdAt", { unique: false })
      }

      // Metadata store (for storing things like lastSyncedAt)
      if (!db.objectStoreNames.contains(STORES.metadata)) {
        db.createObjectStore(STORES.metadata, { keyPath: "key" })
      }

      // ActivityLog store
      if (!db.objectStoreNames.contains(STORES.activityLog)) {
        const store = db.createObjectStore(STORES.activityLog, { keyPath: "id" })
        store.createIndex("byTimestamp", "timestamp", { unique: false })
        store.createIndex("byType", "type", { unique: false })
      }
    }
  })
}

// Generic CRUD operations
async function getDB(): Promise<IDBDatabase> {
  if (!dbInstance) {
    return await initDB()
  }
  return dbInstance
}

export async function put<T>(storeName: StoreName, data: T): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)
    const request = store.put(data)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function putMany<T>(storeName: StoreName, items: T[]): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)

    transaction.onerror = () => reject(transaction.error)
    transaction.oncomplete = () => resolve()

    items.forEach((item) => store.put(item))
  })
}

export async function get<T>(storeName: StoreName, key: IDBValidKey): Promise<T | undefined> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly")
    const store = transaction.objectStore(storeName)
    const request = store.get(key)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function getAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly")
    const store = transaction.objectStore(storeName)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function getAllByIndex<T>(storeName: StoreName, indexName: string, value: IDBValidKey): Promise<T[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly")
    const store = transaction.objectStore(storeName)
    const index = store.index(indexName)
    const request = index.getAll(value)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function remove(storeName: StoreName, key: IDBValidKey): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)
    const request = store.delete(key)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function clear(storeName: StoreName): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)
    const request = store.clear()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// Typed helpers for each entity
export const db = {
  // Users
  users: {
    get: (id: string) => get<User>(STORES.users, id),
    put: (user: User) => put(STORES.users, user),
    getAll: () => getAll<User>(STORES.users),
  },

  // Teams
  teams: {
    get: (id: string) => get<Team>(STORES.teams, id),
    put: (team: Team) => put(STORES.teams, team),
    putMany: (teams: Team[]) => putMany(STORES.teams, teams),
    getAll: () => getAll<Team>(STORES.teams),
  },

  // Memberships
  memberships: {
    get: (userId: string, teamId: string) => get<Membership>(STORES.memberships, [userId, teamId]),
    put: (membership: Membership) => put(STORES.memberships, membership),
    putMany: (memberships: Membership[]) => putMany(STORES.memberships, memberships),
    getByUser: (userId: string) => getAllByIndex<Membership>(STORES.memberships, "byUser", userId),
    getByTeam: (teamId: string) => getAllByIndex<Membership>(STORES.memberships, "byTeam", teamId),
    getAll: () => getAll<Membership>(STORES.memberships),
  },

  // Tickets
  tickets: {
    get: (id: string) => get<Ticket>(STORES.tickets, id),
    put: (ticket: Ticket) => put(STORES.tickets, ticket),
    putMany: (tickets: Ticket[]) => putMany(STORES.tickets, tickets),
    getByTeam: (teamId: string) => getAllByIndex<Ticket>(STORES.tickets, "byTeam", teamId),
    remove: (id: string) => remove(STORES.tickets, id),
    getAll: () => getAll<Ticket>(STORES.tickets),
  },

  // Time entries
  timeEntries: {
    get: (id: string) => get<TimeEntry>(STORES.timeEntries, id),
    put: (entry: TimeEntry) => put(STORES.timeEntries, entry),
    putMany: (entries: TimeEntry[]) => putMany(STORES.timeEntries, entries),
    getByUser: (userId: string) => getAllByIndex<TimeEntry>(STORES.timeEntries, "byUser", userId),
    getByTeam: (teamId: string) => getAllByIndex<TimeEntry>(STORES.timeEntries, "byTeam", teamId),
    getByTicket: (ticketId: string) => getAllByIndex<TimeEntry>(STORES.timeEntries, "byTicket", ticketId),
    getPendingSync: () => getAllByIndex<TimeEntry>(STORES.timeEntries, "pendingSync", true),
    remove: (id: string) => remove(STORES.timeEntries, id),
    getAll: () => getAll<TimeEntry>(STORES.timeEntries),
  },

  // Assignments
  assignments: {
    get: (id: string) => get<Assignment>(STORES.assignments, id),
    put: (assignment: Assignment) => put(STORES.assignments, assignment),
    putMany: (assignments: Assignment[]) => putMany(STORES.assignments, assignments),
    getByTeam: (teamId: string) => getAllByIndex<Assignment>(STORES.assignments, "byTeam", teamId),
    getByTicket: (ticketId: string) => getAllByIndex<Assignment>(STORES.assignments, "byTicket", ticketId),
    remove: (id: string) => remove(STORES.assignments, id),
    getAll: () => getAll<Assignment>(STORES.assignments),
  },

  // Sync queue
  syncQueue: {
    get: (id: string) => get<SyncQueueItem>(STORES.syncQueue, id),
    put: (item: SyncQueueItem) => put(STORES.syncQueue, item),
    remove: (id: string) => remove(STORES.syncQueue, id),
    getAll: () => getAll<SyncQueueItem>(STORES.syncQueue),
    clear: () => clear(STORES.syncQueue),
  },

  // Metadata
  metadata: {
    get: async (key: string): Promise<string | null> => {
      const result = await get<{ key: string; value: string }>(STORES.metadata, key)
      return result?.value || null
    },
    set: (key: string, value: string) => put(STORES.metadata, { key, value }),
  },

  // ActivityLog
  activityLog: {
    get: (id: string) => get<ActivityLogEntry>(STORES.activityLog, id),
    put: (entry: ActivityLogEntry) => put(STORES.activityLog, entry),
    putMany: (entries: ActivityLogEntry[]) => putMany(STORES.activityLog, entries),
    getAll: () => getAll<ActivityLogEntry>(STORES.activityLog),
    remove: (id: string) => remove(STORES.activityLog, id),
    clear: () => clear(STORES.activityLog),
  },
}
