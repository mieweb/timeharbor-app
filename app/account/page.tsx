"use client"

import { LogOut, Trash2, Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle2, Clock, Play, Square, StickyNote, LogIn } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAppStore } from "@/lib/store"
import { triggerSync } from "@/lib/db/sync-manager"
import { cn } from "@/lib/utils"
import type { ActivityLogEntry } from "@/lib/types"

export default function AccountPage() {
  const user = useAppStore((state) => state.user)
  const teams = useAppStore((state) => state.teams)
  const memberships = useAppStore((state) => state.memberships)
  const showConfirm = useAppStore((state) => state.showConfirm)
  const syncStatus = useAppStore((state) => state.syncStatus)
  const lastSyncedAt = useAppStore((state) => state.lastSyncedAt)
  const activityLog = useAppStore((state) => state.activityLog)
  
  // Show all pending across all teams in account page
  const pendingEntries = activityLog.filter(e => e.pendingSync)
  const pendingCount = pendingEntries.length

  const getActivityIcon = (type: ActivityLogEntry["type"]) => {
    switch (type) {
      case "clock-in":
        return <LogIn className="h-4 w-4 text-green-500" />
      case "clock-out":
        return <Clock className="h-4 w-4 text-orange-500" />
      case "timer-start":
        return <Play className="h-4 w-4 text-primary" />
      case "timer-stop":
        return <Square className="h-4 w-4 text-muted-foreground" />
      case "note-added":
        return <StickyNote className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const formatActivityType = (type: ActivityLogEntry["type"]) => {
    switch (type) {
      case "clock-in": return "Clocked In"
      case "clock-out": return "Clocked Out"
      case "timer-start": return "Started Timer"
      case "timer-stop": return "Stopped Timer"
      case "note-added": return "Added Note"
      default: return type
    }
  }

  const initials =
    user?.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?"

  const getRoleForTeam = (teamId: string) => {
    return memberships.find((m) => m.teamId === teamId)?.role
  }

  const handleClearLocalState = () => {
    showConfirm(
      "Clear All Local Data?",
      "This will delete all cached tickets, notes, time entries, and activity logs from your browser. This action cannot be undone. The page will reload after clearing.",
      async () => {
        try {
          // Clear IndexedDB
          const dbName = "time-harbor-db"
          await new Promise<void>((resolve, reject) => {
            const request = indexedDB.deleteDatabase(dbName)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
            request.onblocked = () => {
              console.warn("Database deletion blocked")
              resolve()
            }
          })

          // Reload the page to reset all state
          window.location.reload()
        } catch (error) {
          console.error("Failed to clear local state:", error)
          alert("Failed to clear local data. Please try again.")
        }
      },
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Account</h1>

      {/* Profile */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.avatarUrl || "/placeholder.svg"} alt={user?.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{user?.name}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Teams */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Your Teams</h2>
        {teams.map((team) => {
          const role = getRoleForTeam(team.id)
          return (
            <div
              key={team.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div>
                <h3 className="font-medium text-foreground">{team.name}</h3>
                {team.description && <p className="text-sm text-muted-foreground">{team.description}</p>}
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  role === "owner" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                }`}
              >
                {role === "owner" ? "Owner" : "Member"}
              </span>
            </div>
          )
        })}
      </div>

      {/* Sync Status */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Sync Status</h2>
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          {/* Status indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {syncStatus === "offline" && (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <CloudOff className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Offline</p>
                    <p className="text-sm text-muted-foreground">Changes will sync when online</p>
                  </div>
                </>
              )}
              {syncStatus === "syncing" && (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Syncing...</p>
                    <p className="text-sm text-muted-foreground">Uploading your changes</p>
                  </div>
                </>
              )}
              {syncStatus === "error" && (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Sync Error</p>
                    <p className="text-sm text-muted-foreground">Some changes couldn&apos;t be uploaded</p>
                  </div>
                </>
              )}
              {syncStatus === "idle" && pendingCount === 0 && (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">All Synced</p>
                    <p className="text-sm text-muted-foreground">
                      {lastSyncedAt 
                        ? `Last synced ${new Date(lastSyncedAt).toLocaleTimeString()}`
                        : "All changes are up to date"}
                    </p>
                  </div>
                </>
              )}
              {syncStatus === "idle" && pendingCount > 0 && (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                    <Cloud className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Pending Changes</p>
                    <p className="text-sm text-muted-foreground">
                      {pendingCount} {pendingCount === 1 ? "item" : "items"} waiting to sync
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Pending changes details */}
          {pendingCount > 0 && (
            <div className={cn(
              "rounded-lg border p-3",
              syncStatus === "offline" ? "border-muted bg-muted/30" : "border-warning/30 bg-warning/5"
            )}>
              <p className="text-sm text-muted-foreground">
                You have <span className="font-medium text-foreground">{pendingCount} local {pendingCount === 1 ? "change" : "changes"}</span> that 
                {syncStatus === "offline" 
                  ? " will be synced when you're back online."
                  : " you can sync by clicking the button below."}
              </p>
            </div>
          )}

          {/* Manual sync button */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => triggerSync()}
            disabled={syncStatus === "syncing" || syncStatus === "offline"}
          >
            <RefreshCw className={cn("h-4 w-4", syncStatus === "syncing" && "animate-spin")} />
            {syncStatus === "syncing" ? "Syncing..." : "Sync Now"}
          </Button>
        </div>
      </div>

      {/* Pending Activity (Local Changes) */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Pending Activity</h2>
        <div className="rounded-xl border border-border bg-card">
          {pendingEntries.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50 text-green-500" />
              <p>All activity synced</p>
            </div>
          ) : (
            <ScrollArea className="h-75">
              <div className="p-4 space-y-2">
                {/* Pending Activity Entries grouped by team */}
                {pendingEntries
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((entry) => {
                    const team = teams.find(t => t.id === entry.teamId)
                    return (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background">
                          {getActivityIcon(entry.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">
                              {formatActivityType(entry.type)}
                            </span>
                            {entry.pendingSync && (
                              <span className="inline-flex items-center rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                                Local
                              </span>
                            )}
                          </div>
                          {team && (
                            <p className="text-xs text-primary font-medium">{team.name}</p>
                          )}
                          {entry.ticketTitle && (
                            <p className="text-sm text-muted-foreground truncate">{entry.ticketTitle}</p>
                          )}
                          {entry.note && (
                            <p className="text-sm text-muted-foreground truncate">{entry.note}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(entry.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Developer Tools */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Developer Tools</h2>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-3">
            Clear all locally cached data including tickets, notes, time entries, and activity logs.
          </p>
          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={handleClearLocalState}
          >
            <Trash2 className="h-4 w-4" />
            Clear All Local Data
          </Button>
        </div>
      </div>

      {/* Sign Out */}
      <Button variant="outline" className="w-full gap-2 bg-transparent">
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  )
}
