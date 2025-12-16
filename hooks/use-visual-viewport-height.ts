"use client"

import { useEffect } from "react"

/**
 * Hook that tracks the visual viewport height and exposes it as a CSS variable.
 * This is essential for iOS Safari where the software keyboard changes the 
 * visual viewport but not the layout viewport (100vh stays the same).
 * 
 * The --vvh CSS variable will contain the actual visible height in pixels.
 */
export function useVisualViewportHeightVar() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) {
      // Fallback for browsers without visualViewport support
      document.documentElement.style.setProperty("--vvh", "100dvh")
      return
    }

    const set = () => {
      // Use the visual viewport height, which shrinks when iOS keyboard opens
      document.documentElement.style.setProperty(
        "--vvh",
        `${vv.height}px`
      )
    }

    // Set initial value
    set()
    
    vv.addEventListener("resize", set)
    vv.addEventListener("scroll", set)

    return () => {
      vv.removeEventListener("resize", set)
      vv.removeEventListener("scroll", set)
      // Reset to full viewport height when component unmounts
      document.documentElement.style.setProperty("--vvh", "100dvh")
    }
  }, [])
}
