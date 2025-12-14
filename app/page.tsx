"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const teams = useAppStore((state) => state.teams)
  const currentTeamId = useAppStore((state) => state.currentTeamId)
  const setShowTeamSwitcher = useAppStore((state) => state.setShowTeamSwitcher)
  const setCurrentTeam = useAppStore((state) => state.setCurrentTeam)

  useEffect(() => {
    // Wait for teams to load
    if (teams.length === 0) return

    if (currentTeamId) {
      // Already have a team selected, go to dashboard
      router.push(`/team/${currentTeamId}/dashboard`)
    } else if (teams.length === 1) {
      // Single team, auto-select
      setCurrentTeam(teams[0].id)
      router.push(`/team/${teams[0].id}/dashboard`)
    } else {
      // Multiple teams, show switcher
      setShowTeamSwitcher(true)
    }
  }, [teams, currentTeamId, router, setCurrentTeam, setShowTeamSwitcher])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
