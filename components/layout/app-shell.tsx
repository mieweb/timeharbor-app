"use client"

import type React from "react"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { HeaderClockStatus } from "./header-clock-status"
import { FooterNav } from "./footer-nav"
import { ClockInPromptModal } from "./clock-in-prompt-modal"
import { TeamSwitcherModal } from "../team/team-switcher-modal"
import { AddTicketModal } from "../tickets/add-ticket-modal"
import { StopTimerModal } from "../tickets/stop-timer-modal"
import { TicketNotesModal } from "../tickets/ticket-notes-modal"
import { ConfirmDialog } from "../ui-utils/confirm-dialog"
import { ToastContainer } from "../ui-utils/toast-container"
import { useAppStore } from "@/lib/store"
import { getDataService } from "@/lib/services/data-service"
import { usePersistence } from "@/hooks/use-persistence"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const setAuth = useAppStore((state) => state.setAuth)
  const setTeams = useAppStore((state) => state.setTeams)
  const setCurrentTeam = useAppStore((state) => state.setCurrentTeam)
  const teams = useAppStore((state) => state.teams)
  const currentTeamId = useAppStore((state) => state.currentTeamId)
  const setShowTeamSwitcher = useAppStore((state) => state.setShowTeamSwitcher)

  usePersistence()

  // Initialize auth and teams on mount
  useEffect(() => {
    async function init() {
      const dataService = getDataService()
      const session = await dataService.auth.getSession()

      if (session) {
        setAuth(session.user, session.memberships)
        const userTeams = await dataService.teams.listForUser(session.user.id)
        setTeams(userTeams)

        // If multiple teams and no current team selected, show switcher
        if (userTeams.length > 1 && !currentTeamId) {
          setShowTeamSwitcher(true)
        } else if (userTeams.length === 1) {
          setCurrentTeam(userTeams[0].id)
        }
      }
    }

    init()
  }, [setAuth, setTeams, setCurrentTeam, currentTeamId, setShowTeamSwitcher])

  const isAuthPage = pathname === "/login" || pathname === "/register"

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-background">
      <HeaderClockStatus />

      <main className="app-main-content flex-1 overflow-y-auto pb-20 md:pb-6">
        <div className="app-main-container mx-auto max-w-4xl px-4 py-4">{children}</div>
      </main>

      <FooterNav />
      <TeamSwitcherModal />
      <AddTicketModal />
      <ClockInPromptModal />
      <StopTimerModal />
      <TicketNotesModal />
      <ConfirmDialog />
      <ToastContainer />
    </div>
  )
}
