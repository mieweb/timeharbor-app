"use client"

import type React from "react"

import { useAppStore } from "@/lib/store"

interface PermissionBoundaryProps {
  role: "owner" | "member"
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionBoundary({ role, children, fallback = null }: PermissionBoundaryProps) {
  const currentTeamId = useAppStore((state) => state.currentTeamId)
  const getUserRole = useAppStore((state) => state.getUserRole)

  if (!currentTeamId) return null

  const userRole = getUserRole(currentTeamId)

  // Owner can see everything, member can only see member content
  if (role === "owner" && userRole !== "owner") {
    return <>{fallback}</>
  }

  return <>{children}</>
}
