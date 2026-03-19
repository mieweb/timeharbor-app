"use client"

import { useEffect } from "react"

const STORAGE_KEY = "timeharbor-brand"
const LINK_ID = "mieweb-brand-css"

/**
 * Reads the saved brand from localStorage on mount and injects the
 * corresponding <link> tag.  Must be rendered in the root layout so
 * the brand is applied on every page — not just the settings page.
 */
export function BrandInitializer() {
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      let link = document.getElementById(LINK_ID) as HTMLLinkElement | null
      if (!link) {
        link = document.createElement("link")
        link.id = LINK_ID
        link.rel = "stylesheet"
        document.head.appendChild(link)
      }
      link.href = `/brands/${saved}.css`
    }
  }, [])

  return null
}
