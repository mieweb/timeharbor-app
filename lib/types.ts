// Core data types for Time Harbor

export type UserRole = "owner" | "member"

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

export interface Team {
  id: string
  name: string
  description?: string
  createdAt: string
}

export interface Membership {
  userId: string
  teamId: string
  role: UserRole
  joinedAt: string
}

export type TicketStatus = "open" | "in-progress" | "completed" | "archived"

export interface Ticket {
  id: string
  teamId: string
  title: string
  description?: string
  status: TicketStatus
  createdAt: string
  createdBy: string
  estimatedMs?: number
  notes?: TicketNote[]
}

export interface TicketNote {
  id: string
  content: string
  createdAt: string
  createdBy: string
}

export interface TimeEntry {
  id: string
  userId: string
  teamId: string
  ticketId: string
  start: string // ISO timestamp
  end?: string // ISO timestamp, undefined if active
  durationMs?: number
  note?: string
  source: "local" | "server"
  pendingSync: boolean
  createdAt: string
}

export interface Assignment {
  id: string
  teamId: string
  ticketId: string
  assigneeUserId: string
  assignedBy: string
  assignedAt: string
}

// Active timer state
export interface ActiveTimer {
  teamId: string
  ticketId: string
  timeEntryId: string
  startedAt: string // ISO timestamp
  localClockStart: number // performance.now() or Date.now()
}

// Sync status
export type SyncStatus = "idle" | "syncing" | "error" | "offline"

export interface SyncQueueItem {
  id: string
  type: "create" | "update" | "delete"
  entity: "timeEntry" | "ticket" | "assignment"
  payload: unknown
  createdAt: string
  retryCount: number
}

// Activity log entry type for tracking clock and timer events
export type ActivityLogEntryType = "clock-in" | "clock-out" | "timer-start" | "timer-stop" | "note-added"

export interface ActivityLogEntry {
  id: string
  type: ActivityLogEntryType
  timestamp: string // ISO timestamp
  ticketId?: string
  ticketTitle?: string
  durationMs?: number // For clock-out and timer-stop entries
  note?: string
}
