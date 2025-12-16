// Main Zustand store with slices

import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import type {
  User,
  Team,
  Membership,
  Ticket,
  TimeEntry,
  Assignment,
  ActiveTimer,
  SyncStatus,
  SyncQueueItem,
  ActivityLogEntry,
} from "@/lib/types"

// Auth slice
interface AuthSlice {
  user: User | null
  memberships: Membership[]
  isAuthenticated: boolean
  setAuth: (user: User | null, memberships: Membership[]) => void
  clearAuth: () => void
  getUserRole: (teamId: string) => "owner" | "member" | null
}

// Team slice
interface TeamSlice {
  currentTeamId: string | null
  teams: Team[]
  setTeams: (teams: Team[]) => void
  setCurrentTeam: (teamId: string | null) => void
  getCurrentTeam: () => Team | null
}

// Tickets slice
interface TicketsSlice {
  ticketsByTeam: Record<string, Ticket[]>
  selectedTicketId: string | null
  setTickets: (teamId: string, tickets: Ticket[]) => void
  addTicket: (ticket: Ticket) => void
  updateTicket: (ticketId: string, updates: Partial<Ticket>) => void
  removeTicket: (ticketId: string) => void
  selectTicket: (ticketId: string | null) => void
  getTicketsForCurrentTeam: () => Ticket[]
  reorderTicket: (teamId: string, ticketId: string, direction: "up" | "down") => void
  reorderTicketToIndex: (teamId: string, ticketId: string, newIndex: number) => void
  addNoteToTicket: (ticketId: string, content: string) => void
}

// Timer slice
interface TimerSlice {
  isClockedIn: boolean
  clockedInAt: string | null
  activeTimer: ActiveTimer | null
  timeEntries: TimeEntry[]
  activityLog: ActivityLogEntry[]
  clockIn: () => void
  clockInAndStartTimer: (teamId: string, ticketId: string, ticketTitle: string) => string
  clockOut: () => void
  startTimer: (teamId: string, ticketId: string, ticketTitle: string) => string // returns timeEntryId
  stopTimer: (note?: string) => TimeEntry | null
  setTimeEntries: (entries: TimeEntry[]) => void
  addTimeEntry: (entry: TimeEntry) => void
  getElapsedMs: () => number
  getTodayTotalMs: () => number
}

// Sync slice
interface SyncSlice {
  syncStatus: SyncStatus
  syncQueue: SyncQueueItem[]
  lastSyncedAt: string | null
  persistenceLoaded: boolean
  pendingChangesCount: number
  setSyncStatus: (status: SyncStatus) => void
  addToSyncQueue: (item: Omit<SyncQueueItem, "id" | "createdAt" | "retryCount">) => void
  removeFromSyncQueue: (id: string) => void
  setLastSyncedAt: (timestamp: string) => void
  setPersistenceLoaded: (loaded: boolean) => void
  incrementPendingChanges: () => void
  decrementPendingChanges: () => void
  setPendingChangesCount: (count: number) => void
  getPendingChangesCount: () => number
}

// UI slice
interface UISlice {
  showTeamSwitcher: boolean
  showAddTicketModal: boolean
  showClockInPrompt: {
    open: boolean
    pendingTicketId: string | null
    pendingTeamId: string | null
  }
  showConfirmDialog: {
    open: boolean
    title: string
    message: string
    onConfirm: (() => void) | null
  }
  showStopTimerPrompt: {
    open: boolean
    ticketId: string | null
    ticketTitle: string | null
    onConfirm: ((note: string) => void) | null
  }
  showTicketNotesModal: {
    open: boolean
    ticketId: string | null
  }
  toasts: Array<{ id: string; message: string; type: "success" | "error" | "info" }>
  setShowTeamSwitcher: (show: boolean) => void
  setShowAddTicketModal: (show: boolean) => void
  showClockInPromptFor: (teamId: string, ticketId: string) => void
  hideClockInPrompt: () => void
  showConfirm: (title: string, message: string, onConfirm: () => void) => void
  hideConfirm: () => void
  showStopTimerPromptFor: (ticketId: string, ticketTitle: string, onConfirm: (note: string) => void) => void
  hideStopTimerPrompt: () => void
  showTicketNotes: (ticketId: string) => void
  hideTicketNotes: () => void
  addToast: (message: string, type: "success" | "error" | "info") => void
  removeToast: (id: string) => void
}

// Members slice
interface MembersSlice {
  membersByTeam: Record<string, (Membership & { user: User })[]>
  assignmentsByTeam: Record<string, Assignment[]>
  setMembers: (teamId: string, members: (Membership & { user: User })[]) => void
  setAssignments: (teamId: string, assignments: Assignment[]) => void
  addAssignment: (assignment: Assignment) => void
  removeAssignment: (assignmentId: string) => void
}

// Combined store type
export type AppStore = AuthSlice & TeamSlice & TicketsSlice & TimerSlice & SyncSlice & UISlice & MembersSlice

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    // Auth slice
    user: null,
    memberships: [],
    isAuthenticated: false,
    setAuth: (user, memberships) => set({ user, memberships, isAuthenticated: !!user }),
    clearAuth: () => set({ user: null, memberships: [], isAuthenticated: false }),
    getUserRole: (teamId) => {
      const { user, memberships } = get()
      if (!user) return null
      const membership = memberships.find((m) => m.teamId === teamId && m.userId === user.id)
      return membership?.role || null
    },

    // Team slice
    currentTeamId: null,
    teams: [],
    setTeams: (teams) => set({ teams }),
    setCurrentTeam: (teamId) => set({ currentTeamId: teamId }),
    getCurrentTeam: () => {
      const { teams, currentTeamId } = get()
      return teams.find((t) => t.id === currentTeamId) || null
    },

    // Tickets slice
    ticketsByTeam: {},
    selectedTicketId: null,
    setTickets: (teamId, tickets) =>
      set((state) => ({
        ticketsByTeam: { ...state.ticketsByTeam, [teamId]: tickets },
      })),
    addTicket: (ticket) =>
      set((state) => ({
        ticketsByTeam: {
          ...state.ticketsByTeam,
          [ticket.teamId]: [...(state.ticketsByTeam[ticket.teamId] || []), ticket],
        },
      })),
    updateTicket: (ticketId, updates) =>
      set((state) => {
        const newTicketsByTeam = { ...state.ticketsByTeam }
        for (const teamId in newTicketsByTeam) {
          newTicketsByTeam[teamId] = newTicketsByTeam[teamId].map((t) => (t.id === ticketId ? { ...t, ...updates } : t))
        }
        return { ticketsByTeam: newTicketsByTeam }
      }),
    removeTicket: (ticketId) =>
      set((state) => {
        const newTicketsByTeam = { ...state.ticketsByTeam }
        for (const teamId in newTicketsByTeam) {
          newTicketsByTeam[teamId] = newTicketsByTeam[teamId].filter((t) => t.id !== ticketId)
        }
        return { ticketsByTeam: newTicketsByTeam }
      }),
    selectTicket: (ticketId) => set({ selectedTicketId: ticketId }),
    getTicketsForCurrentTeam: () => {
      const { ticketsByTeam, currentTeamId } = get()
      if (!currentTeamId) return []
      return ticketsByTeam[currentTeamId] || []
    },
    reorderTicket: (teamId, ticketId, direction) =>
      set((state) => {
        const tickets = [...(state.ticketsByTeam[teamId] || [])]
        const currentIndex = tickets.findIndex((t) => t.id === ticketId)
        if (currentIndex === -1) return state

        const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
        if (newIndex < 0 || newIndex >= tickets.length) return state

        // Swap tickets
        const temp = tickets[currentIndex]
        tickets[currentIndex] = tickets[newIndex]
        tickets[newIndex] = temp

        return {
          ticketsByTeam: { ...state.ticketsByTeam, [teamId]: tickets },
        }
      }),
    reorderTicketToIndex: (teamId, ticketId, newIndex) =>
      set((state) => {
        const tickets = [...(state.ticketsByTeam[teamId] || [])]
        const currentIndex = tickets.findIndex((t) => t.id === ticketId)
        if (currentIndex === -1 || currentIndex === newIndex) return state

        // Remove from current position and insert at new position
        const [ticket] = tickets.splice(currentIndex, 1)
        tickets.splice(newIndex, 0, ticket)

        return {
          ticketsByTeam: { ...state.ticketsByTeam, [teamId]: tickets },
        }
      }),
    addNoteToTicket: (ticketId, content) =>
      set((state) => {
        const { user, ticketsByTeam } = get()
        const newNote = {
          id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          content,
          createdAt: new Date().toISOString(),
          createdBy: user?.id || "",
        }

        let ticketTitle = "Unknown ticket"
        for (const teamId in ticketsByTeam) {
          const ticket = ticketsByTeam[teamId].find((t) => t.id === ticketId)
          if (ticket) {
            ticketTitle = ticket.title
            break
          }
        }

        const activityEntry: ActivityLogEntry = {
          id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: "note-added",
          timestamp: new Date().toISOString(),
          ticketId,
          ticketTitle,
          note: content,
        }

        const newTicketsByTeam = { ...state.ticketsByTeam }
        let updatedTicket: Ticket | null = null
        for (const teamId in newTicketsByTeam) {
          newTicketsByTeam[teamId] = newTicketsByTeam[teamId].map((t) => {
            if (t.id === ticketId) {
              updatedTicket = { ...t, notes: [...(t.notes || []), newNote] }
              return updatedTicket
            }
            return t
          })
        }

        // Queue the ticket update for sync
        if (updatedTicket) {
          import("@/lib/db/sync-manager").then(({ queueForSync }) => {
            queueForSync("update", "ticket", updatedTicket)
          })
        }

        return {
          ticketsByTeam: newTicketsByTeam,
          activityLog: [activityEntry, ...state.activityLog],
          pendingChangesCount: state.pendingChangesCount + 1,
        }
      }),

    // Timer slice
    isClockedIn: false,
    clockedInAt: null,
    activeTimer: null,
    timeEntries: [],
    activityLog: [],
    clockIn: () => {
      const now = new Date().toISOString()
      const entry: ActivityLogEntry = {
        id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "clock-in",
        timestamp: now,
      }
      set((state) => ({
        isClockedIn: true,
        clockedInAt: now,
        activityLog: [entry, ...state.activityLog],
      }))
      get().addToast("Clocked in successfully", "success")
    },
    clockInAndStartTimer: (teamId, ticketId, ticketTitle) => {
      const now = new Date().toISOString()
      const timeEntryId = `time-${Date.now()}-${Math.random().toString(36).slice(2)}`
      
      // Clock in entry
      const clockInEntry: ActivityLogEntry = {
        id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "clock-in",
        timestamp: now,
      }
      
      // Timer start entry
      const timerStartEntry: ActivityLogEntry = {
        id: `activity-${Date.now() + 1}-${Math.random().toString(36).slice(2, 8)}`,
        type: "timer-start",
        timestamp: now,
        ticketId,
        ticketTitle,
      }
      
      const timeEntry: TimeEntry = {
        id: timeEntryId,
        userId: get().user?.id || "",
        teamId,
        ticketId,
        start: now,
        source: "local",
        pendingSync: true,
        createdAt: now,
      }
      
      // Set everything in one atomic update
      set((state) => ({
        isClockedIn: true,
        clockedInAt: now,
        activeTimer: {
          teamId,
          ticketId,
          timeEntryId,
          startedAt: now,
          localClockStart: Date.now(),
        },
        timeEntries: [...state.timeEntries, timeEntry],
        activityLog: [timerStartEntry, clockInEntry, ...state.activityLog],
      }))
      
      get().addToast("Clocked in successfully", "success")
      
      import("@/lib/db/sync-manager").then(({ queueForSync }) => {
        queueForSync("create", "timeEntry", timeEntry)
      })
      
      return timeEntryId
    },
    clockOut: () => {
      const { activeTimer, stopTimer, clockedInAt } = get()
      if (activeTimer) {
        stopTimer()
      }
      const now = new Date().toISOString()
      const durationMs = clockedInAt ? Date.now() - new Date(clockedInAt).getTime() : 0
      const entry: ActivityLogEntry = {
        id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "clock-out",
        timestamp: now,
        durationMs,
      }
      // Also clear any pending clock-in prompts
      set((state) => ({
        isClockedIn: false,
        clockedInAt: null,
        activityLog: [entry, ...state.activityLog],
        showClockInPrompt: { open: false, pendingTicketId: null, pendingTeamId: null },
      }))
      get().addToast("Clocked out", "info")
    },
    startTimer: (teamId, ticketId, ticketTitle) => {
      const { isClockedIn } = get()
      if (!isClockedIn) {
        console.log("[v0] Cannot start timer: not clocked in")
        return ""
      }

      const timeEntryId = `time-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const now = new Date().toISOString()
      set({
        activeTimer: {
          teamId,
          ticketId,
          timeEntryId,
          startedAt: now,
          localClockStart: Date.now(),
        },
      })
      const entry: TimeEntry = {
        id: timeEntryId,
        userId: get().user?.id || "",
        teamId,
        ticketId,
        start: now,
        source: "local",
        pendingSync: true,
        createdAt: now,
      }
      const activityEntry: ActivityLogEntry = {
        id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "timer-start",
        timestamp: now,
        ticketId,
        ticketTitle,
      }
      set((state) => ({
        timeEntries: [...state.timeEntries, entry],
        activityLog: [activityEntry, ...state.activityLog],
      }))

      import("@/lib/db/sync-manager").then(({ queueForSync }) => {
        queueForSync("create", "timeEntry", entry)
      })

      return timeEntryId
    },
    stopTimer: (note?: string) => {
      const { activeTimer, timeEntries, ticketsByTeam } = get()
      if (!activeTimer) {
        return null
      }

      const now = new Date().toISOString()
      const startTime = new Date(activeTimer.startedAt).getTime()
      const durationMs = Date.now() - startTime

      const updatedEntry = timeEntries.find((e) => e.id === activeTimer.timeEntryId)
      const ticket = ticketsByTeam[activeTimer.teamId]?.find((t) => t.id === activeTimer.ticketId)

      const activityEntry: ActivityLogEntry = {
        id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "timer-stop",
        timestamp: now,
        ticketId: activeTimer.ticketId,
        ticketTitle: ticket?.title || "Unknown ticket",
        durationMs,
        note,
      }

      if (updatedEntry) {
        const finalEntry: TimeEntry = {
          ...updatedEntry,
          end: now,
          durationMs,
          note,
          pendingSync: true,
        }
        set((state) => ({
          activeTimer: null,
          timeEntries: state.timeEntries.map((e) => (e.id === activeTimer.timeEntryId ? finalEntry : e)),
          activityLog: [activityEntry, ...state.activityLog],
        }))

        import("@/lib/db/sync-manager").then(({ queueForSync }) => {
          queueForSync("update", "timeEntry", finalEntry)
        })

        return finalEntry
      }

      set((state) => ({
        activeTimer: null,
        activityLog: [activityEntry, ...state.activityLog],
      }))
      return null
    },
    setTimeEntries: (entries) => set({ timeEntries: entries }),
    addTimeEntry: (entry) => set((state) => ({ timeEntries: [...state.timeEntries, entry] })),
    getElapsedMs: () => {
      const { activeTimer } = get()
      if (!activeTimer) return 0
      return Date.now() - activeTimer.localClockStart
    },
    getTodayTotalMs: () => {
      const { activityLog, isClockedIn, clockedInAt } = get()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayMs = today.getTime()

      let totalMs = 0

      for (const entry of activityLog) {
        const entryTime = new Date(entry.timestamp).getTime()
        if (entryTime >= todayMs && entry.type === "clock-out" && entry.durationMs) {
          totalMs += entry.durationMs
        }
      }

      if (isClockedIn && clockedInAt) {
        const clockedInTime = new Date(clockedInAt).getTime()
        if (clockedInTime >= todayMs) {
          totalMs += Date.now() - clockedInTime
        }
      }

      return totalMs
    },

    // Sync slice
    syncStatus: "idle",
    syncQueue: [],
    lastSyncedAt: null,
    persistenceLoaded: false,
    pendingChangesCount: 0,
    setSyncStatus: (status) => set({ syncStatus: status }),
    incrementPendingChanges: () => set((state) => ({ pendingChangesCount: state.pendingChangesCount + 1 })),
    decrementPendingChanges: () => set((state) => ({ pendingChangesCount: Math.max(0, state.pendingChangesCount - 1) })),
    setPendingChangesCount: (count) => set({ pendingChangesCount: count }),
    getPendingChangesCount: () => {
      const { syncQueue, ticketsByTeam } = get()
      // Count sync queue items + tickets with local notes
      let localNotesCount = 0
      for (const teamId in ticketsByTeam) {
        for (const ticket of ticketsByTeam[teamId]) {
          if (ticket.notes && ticket.notes.length > 0) {
            localNotesCount += ticket.notes.length
          }
        }
      }
      return syncQueue.length + localNotesCount
    },
    addToSyncQueue: (item) =>
      set((state) => ({
        syncQueue: [
          ...state.syncQueue,
          {
            ...item,
            id: `sync-${Date.now()}`,
            createdAt: new Date().toISOString(),
            retryCount: 0,
          },
        ],
      })),
    removeFromSyncQueue: (id) =>
      set((state) => ({
        syncQueue: state.syncQueue.filter((item) => item.id !== id),
      })),
    setLastSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp }),
    setPersistenceLoaded: (loaded) => set({ persistenceLoaded: loaded }),

    // UI slice
    showTeamSwitcher: false,
    showAddTicketModal: false,
    showClockInPrompt: { open: false, pendingTicketId: null, pendingTeamId: null },
    showConfirmDialog: { open: false, title: "", message: "", onConfirm: null },
    showStopTimerPrompt: { open: false, ticketId: null, ticketTitle: null, onConfirm: null },
    showTicketNotesModal: { open: false, ticketId: null },
    toasts: [],
    setShowTeamSwitcher: (show) => set({ showTeamSwitcher: show }),
    setShowAddTicketModal: (show) => set({ showAddTicketModal: show }),
    showClockInPromptFor: (teamId, ticketId) =>
      set({
        showClockInPrompt: { open: true, pendingTicketId: ticketId, pendingTeamId: teamId },
      }),
    hideClockInPrompt: () =>
      set({
        showClockInPrompt: { open: false, pendingTicketId: null, pendingTeamId: null },
      }),
    showConfirm: (title, message, onConfirm) =>
      set({
        showConfirmDialog: { open: true, title, message, onConfirm },
      }),
    hideConfirm: () =>
      set({
        showConfirmDialog: { open: false, title: "", message: "", onConfirm: null },
      }),
    showStopTimerPromptFor: (ticketId, ticketTitle, onConfirm) =>
      set({
        showStopTimerPrompt: { open: true, ticketId, ticketTitle, onConfirm },
      }),
    hideStopTimerPrompt: () =>
      set({
        showStopTimerPrompt: { open: false, ticketId: null, ticketTitle: null, onConfirm: null },
      }),
    showTicketNotes: (ticketId) =>
      set({
        showTicketNotesModal: { open: true, ticketId },
      }),
    hideTicketNotes: () =>
      set({
        showTicketNotesModal: { open: false, ticketId: null },
      }),
    addToast: (message, type) => {
      const id = `toast-${Date.now()}`
      set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
      }, 4000)
    },
    removeToast: (id) =>
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      })),

    // Members slice
    membersByTeam: {},
    assignmentsByTeam: {},
    setMembers: (teamId, members) =>
      set((state) => ({
        membersByTeam: { ...state.membersByTeam, [teamId]: members },
      })),
    setAssignments: (teamId, assignments) =>
      set((state) => ({
        assignmentsByTeam: { ...state.assignmentsByTeam, [teamId]: assignments },
      })),
    addAssignment: (assignment) =>
      set((state) => ({
        assignmentsByTeam: {
          ...state.assignmentsByTeam,
          [assignment.teamId]: [...(state.assignmentsByTeam[assignment.teamId] || []), assignment],
        },
      })),
    removeAssignment: (assignmentId) =>
      set((state) => {
        const newAssignmentsByTeam = { ...state.assignmentsByTeam }
        for (const teamId in newAssignmentsByTeam) {
          newAssignmentsByTeam[teamId] = newAssignmentsByTeam[teamId].filter((a) => a.id !== assignmentId)
        }
        return { assignmentsByTeam: newAssignmentsByTeam }
      }),
  })),
)

// Selectors for optimized subscriptions
export const selectUser = (state: AppStore) => state.user
export const selectIsAuthenticated = (state: AppStore) => state.isAuthenticated
export const selectCurrentTeamId = (state: AppStore) => state.currentTeamId
export const selectTeams = (state: AppStore) => state.teams
export const selectActiveTimer = (state: AppStore) => state.activeTimer
export const selectSyncStatus = (state: AppStore) => state.syncStatus
export const selectIsClockedIn = (state: AppStore) => state.isClockedIn
export const selectActivityLog = (state: AppStore) => state.activityLog
