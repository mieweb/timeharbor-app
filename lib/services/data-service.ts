// Abstract DataService interface for pluggable backends (Meteor.js / Supabase)

import type { User, Team, Membership, Ticket, TimeEntry, Assignment, ActivityLogEntry } from "@/lib/types"

export interface AuthService {
  getSession(): Promise<{ user: User; memberships: Membership[] } | null>
  signIn(email: string, password: string): Promise<{ user: User; memberships: Membership[] }>
  signOut(): Promise<void>
}

export interface TeamsService {
  listForUser(userId: string): Promise<Team[]>
  get(teamId: string): Promise<Team | null>
}

export interface TicketsService {
  list(teamId: string): Promise<Ticket[]>
  create(teamId: string, payload: Omit<Ticket, "id" | "teamId" | "createdAt">): Promise<Ticket>
  update(id: string, payload: Partial<Ticket>): Promise<Ticket>
  delete(id: string): Promise<void>
}

export interface TimeService {
  create(entry: Omit<TimeEntry, "id" | "createdAt">): Promise<TimeEntry>
  update(id: string, payload: Partial<TimeEntry>): Promise<TimeEntry>
  list(teamId: string, since?: string): Promise<TimeEntry[]>
  listForUser(userId: string, since?: string): Promise<TimeEntry[]>
}

export interface MembersService {
  list(teamId: string): Promise<(Membership & { user: User })[]>
}

export interface AssignmentsService {
  list(teamId: string): Promise<Assignment[]>
  create(payload: Omit<Assignment, "id" | "assignedAt">): Promise<Assignment>
  update(id: string, payload: Partial<Assignment>): Promise<Assignment>
  delete(id: string): Promise<void>
}

export interface ActivityLogService {
  list(userId: string, since?: string): Promise<ActivityLogEntry[]>
  create(entry: Omit<ActivityLogEntry, "id"> & { id?: string }): Promise<ActivityLogEntry>
  createMany(entries: Omit<ActivityLogEntry, "id">[]): Promise<ActivityLogEntry[]>
}

export interface DataService {
  auth: AuthService
  teams: TeamsService
  tickets: TicketsService
  time: TimeService
  members: MembersService
  assignments: AssignmentsService
  activityLog: ActivityLogService
}

// Factory function to get the data service based on environment
export function getDataService(): DataService {
  // For now, return the mock service
  // In production, this would check env vars to return Meteor or Supabase adapter
  return getMockDataService()
}

// Mock data for development
const mockUsers: User[] = [
  { id: "user-1", name: "Alex Johnson", email: "alex@example.com" },
  { id: "user-2", name: "Sam Wilson", email: "sam@example.com" },
  { id: "user-3", name: "Jordan Lee", email: "jordan@example.com" },
]

const mockTeams: Team[] = [
  { id: "team-1", name: "Engineering", description: "Product development team", createdAt: "2024-01-01T00:00:00Z" },
  { id: "team-2", name: "Design", description: "UI/UX design team", createdAt: "2024-01-15T00:00:00Z" },
]

const mockMemberships: Membership[] = [
  { userId: "user-1", teamId: "team-1", role: "owner", joinedAt: "2024-01-01T00:00:00Z" },
  { userId: "user-1", teamId: "team-2", role: "member", joinedAt: "2024-01-15T00:00:00Z" },
  { userId: "user-2", teamId: "team-1", role: "member", joinedAt: "2024-01-05T00:00:00Z" },
  { userId: "user-3", teamId: "team-1", role: "member", joinedAt: "2024-02-01T00:00:00Z" },
  { userId: "user-3", teamId: "team-2", role: "owner", joinedAt: "2024-01-15T00:00:00Z" },
]

const mockTickets: Ticket[] = [
  {
    id: "ticket-1",
    teamId: "team-1",
    title: "Setup CI/CD Pipeline",
    status: "in-progress",
    createdAt: "2024-03-01T00:00:00Z",
    createdBy: "user-1",
  },
  {
    id: "ticket-2",
    teamId: "team-1",
    title: "API Documentation",
    status: "open",
    createdAt: "2024-03-05T00:00:00Z",
    createdBy: "user-1",
  },
  {
    id: "ticket-3",
    teamId: "team-1",
    title: "Database Migration",
    status: "completed",
    createdAt: "2024-02-20T00:00:00Z",
    createdBy: "user-2",
  },
  {
    id: "ticket-4",
    teamId: "team-2",
    title: "Dashboard Redesign",
    status: "in-progress",
    createdAt: "2024-03-10T00:00:00Z",
    createdBy: "user-3",
  },
  {
    id: "ticket-5",
    teamId: "team-2",
    title: "Mobile App Wireframes",
    status: "open",
    createdAt: "2024-03-12T00:00:00Z",
    createdBy: "user-1",
  },
]

const mockTimeEntries: TimeEntry[] = []
const mockActivityLog: ActivityLogEntry[] = []
const mockAssignments: Assignment[] = [
  {
    id: "assign-1",
    teamId: "team-1",
    ticketId: "ticket-1",
    assigneeUserId: "user-2",
    assignedBy: "user-1",
    assignedAt: "2024-03-01T00:00:00Z",
  },
  {
    id: "assign-2",
    teamId: "team-1",
    ticketId: "ticket-2",
    assigneeUserId: "user-3",
    assignedBy: "user-1",
    assignedAt: "2024-03-05T00:00:00Z",
  },
]

function getMockDataService(): DataService {
  return {
    auth: {
      async getSession() {
        // Simulate logged in user
        const user = mockUsers[0]
        const memberships = mockMemberships.filter((m) => m.userId === user.id)
        return { user, memberships }
      },
      async signIn(email: string) {
        const user = mockUsers.find((u) => u.email === email) || mockUsers[0]
        const memberships = mockMemberships.filter((m) => m.userId === user.id)
        return { user, memberships }
      },
      async signOut() {
        // No-op for mock
      },
    },
    teams: {
      async listForUser(userId: string) {
        const teamIds = mockMemberships.filter((m) => m.userId === userId).map((m) => m.teamId)
        return mockTeams.filter((t) => teamIds.includes(t.id))
      },
      async get(teamId: string) {
        return mockTeams.find((t) => t.id === teamId) || null
      },
    },
    tickets: {
      async list(teamId: string) {
        return mockTickets.filter((t) => t.teamId === teamId)
      },
      async create(teamId: string, payload) {
        const ticket: Ticket = {
          ...payload,
          id: `ticket-${Date.now()}`,
          teamId,
          createdAt: new Date().toISOString(),
        }
        mockTickets.push(ticket)
        return ticket
      },
      async update(id: string, payload) {
        const index = mockTickets.findIndex((t) => t.id === id)
        if (index >= 0) {
          mockTickets[index] = { ...mockTickets[index], ...payload }
          return mockTickets[index]
        }
        throw new Error("Ticket not found")
      },
      async delete(id: string) {
        const index = mockTickets.findIndex((t) => t.id === id)
        if (index >= 0) {
          mockTickets.splice(index, 1)
        }
      },
    },
    time: {
      async create(entry) {
        const timeEntry: TimeEntry = {
          ...entry,
          id: `time-${Date.now()}`,
          createdAt: new Date().toISOString(),
        }
        mockTimeEntries.push(timeEntry)
        return timeEntry
      },
      async update(id: string, payload) {
        const index = mockTimeEntries.findIndex((t) => t.id === id)
        if (index >= 0) {
          mockTimeEntries[index] = { ...mockTimeEntries[index], ...payload }
          return mockTimeEntries[index]
        }
        throw new Error("Time entry not found")
      },
      async list(teamId: string) {
        return mockTimeEntries.filter((t) => t.teamId === teamId)
      },
      async listForUser(userId: string) {
        return mockTimeEntries.filter((t) => t.userId === userId)
      },
    },
    members: {
      async list(teamId: string) {
        const memberships = mockMemberships.filter((m) => m.teamId === teamId)
        return memberships.map((m) => ({
          ...m,
          user: mockUsers.find((u) => u.id === m.userId)!,
        }))
      },
    },
    assignments: {
      async list(teamId: string) {
        return mockAssignments.filter((a) => a.teamId === teamId)
      },
      async create(payload) {
        const assignment: Assignment = {
          ...payload,
          id: `assign-${Date.now()}`,
          assignedAt: new Date().toISOString(),
        }
        mockAssignments.push(assignment)
        return assignment
      },
      async update(id: string, payload) {
        const index = mockAssignments.findIndex((a) => a.id === id)
        if (index >= 0) {
          mockAssignments[index] = { ...mockAssignments[index], ...payload }
          return mockAssignments[index]
        }
        throw new Error("Assignment not found")
      },
      async delete(id: string) {
        const index = mockAssignments.findIndex((a) => a.id === id)
        if (index >= 0) {
          mockAssignments.splice(index, 1)
        }
      },
    },
    activityLog: {
      async list(userId: string, since?: string) {
        let entries = mockActivityLog.filter((e) => e.userId === userId)
        if (since) {
          entries = entries.filter((e) => new Date(e.timestamp) > new Date(since))
        }
        return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      },
      async create(entry) {
        const logEntry: ActivityLogEntry = {
          ...entry,
          // Preserve ID if provided, otherwise generate new one
          id: entry.id || `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        }
        // Check if entry with this ID already exists (prevent duplicates)
        const existingIndex = mockActivityLog.findIndex((e) => e.id === logEntry.id)
        if (existingIndex >= 0) {
          mockActivityLog[existingIndex] = logEntry
        } else {
          mockActivityLog.push(logEntry)
        }
        return logEntry
      },
      async createMany(entries) {
        const createdEntries = entries.map((entry) => ({
          ...entry,
          id: entry.id || `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        }))
        createdEntries.forEach((logEntry) => {
          const existingIndex = mockActivityLog.findIndex((e) => e.id === logEntry.id)
          if (existingIndex >= 0) {
            mockActivityLog[existingIndex] = logEntry
          } else {
            mockActivityLog.push(logEntry)
          }
        })
        return createdEntries
      },
    },
  }
}
