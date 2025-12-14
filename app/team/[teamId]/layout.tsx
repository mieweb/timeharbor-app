import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Time Harbor",
  description: "Track your time across teams and projects",
}

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
