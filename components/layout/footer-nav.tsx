"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Ticket, Users, User, LogIn, LogOut } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useTimer, formatDuration } from "@/hooks/use-timer"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "tickets", label: "Tickets", icon: Ticket },
]

export function FooterNav() {
  const pathname = usePathname()
  const currentTeamId = useAppStore((state) => state.currentTeamId)
  const isClockedIn = useAppStore((state) => state.isClockedIn)
  const clockIn = useAppStore((state) => state.clockIn)
  const clockOut = useAppStore((state) => state.clockOut)
  const showConfirm = useAppStore((state) => state.showConfirm)
  const { isRunning, elapsedMs } = useTimer()

  const handleClockToggle = () => {
    if (isClockedIn) {
      if (isRunning) {
        showConfirm(
          "Clock Out?",
          "You have an active timer running. Clocking out will stop the timer. Continue?",
          () => {
            clockOut()
          },
        )
      } else {
        clockOut()
      }
    } else {
      clockIn()
    }
  }

  if (!currentTeamId) return null

  return (
    <nav className="app-footer-nav fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden supports-[backdrop-filter]:bg-card/80">
      <div className="nav-container mx-auto flex h-16 max-w-4xl items-center justify-around px-2">
        {/* Left nav items */}
        {navItems.map((item) => {
          const href = `/team/${currentTeamId}/${item.href}`
          const isActive = pathname === href || pathname.startsWith(href + "/")
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "nav-item flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className="nav-item-label">{item.label}</span>
            </Link>
          )
        })}

        {/* Center clock button */}
        <button
          onClick={handleClockToggle}
          className={cn(
            "nav-clock-button relative -mt-6 flex h-16 w-16 flex-col items-center justify-center rounded-full shadow-lg transition-all active:scale-95",
            isClockedIn ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground",
          )}
        >
          {isClockedIn ? (
            <>
              {isRunning && (
                <span className="nav-clock-pulse absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive-foreground opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive-foreground" />
                </span>
              )}
              <LogOut className="h-6 w-6" />
              {isRunning ? (
                <span className="nav-clock-time text-[10px] font-mono font-semibold">{formatDuration(elapsedMs)}</span>
              ) : (
                <span className="nav-clock-label text-[10px] font-medium">Out</span>
              )}
            </>
          ) : (
            <>
              <LogIn className="h-6 w-6" />
              <span className="nav-clock-label text-[10px] font-medium">In</span>
            </>
          )}
        </button>

        {/* Right nav items */}
        <Link
          href={`/team/${currentTeamId}/members`}
          className={cn(
            "nav-item flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors",
            pathname.includes("/members") ? "text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Users className={cn("h-5 w-5", pathname.includes("/members") && "text-primary")} />
          <span className="nav-item-label">Team</span>
        </Link>

        <Link
          href="/account"
          className={cn(
            "nav-item nav-item--account flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors",
            pathname === "/account" ? "text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <User className="h-5 w-5" />
          <span className="nav-item-label">Account</span>
        </Link>
      </div>
    </nav>
  )
}
