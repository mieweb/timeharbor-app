"use client"

import { LogOut, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"

export default function AccountPage() {
  const user = useAppStore((state) => state.user)
  const teams = useAppStore((state) => state.teams)
  const memberships = useAppStore((state) => state.memberships)
  const showConfirm = useAppStore((state) => state.showConfirm)

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
