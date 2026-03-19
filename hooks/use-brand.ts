"use client"

import { useState, useEffect, useCallback } from "react"

const BRANDS = [
  { value: "bluehive", label: "BlueHive Health" },
  { value: "mieweb", label: "MIE Web" },
  { value: "ozwell", label: "Ozwell AI" },
  { value: "webchart", label: "WebChart" },
  { value: "enterprise-health", label: "Enterprise Health" },
  { value: "waggleline", label: "WaggleLine" },
] as const

export type BrandId = (typeof BRANDS)[number]["value"]

const STORAGE_KEY = "timeharbor-brand"
const LINK_ID = "mieweb-brand-css"

export function useBrand() {
  const [brand, setBrandState] = useState<BrandId>("bluehive")

  // Load saved brand on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as BrandId | null
    if (saved && BRANDS.some((b) => b.value === saved)) {
      setBrandState(saved)
      applyBrandCSS(saved)
    }
  }, [])

  const setBrand = useCallback((newBrand: BrandId) => {
    setBrandState(newBrand)
    localStorage.setItem(STORAGE_KEY, newBrand)
    applyBrandCSS(newBrand)
  }, [])

  return { brand, setBrand, brands: BRANDS }
}

/** Swap the brand stylesheet link tag to load a different brand's CSS variables */
function applyBrandCSS(brand: BrandId) {
  let link = document.getElementById(LINK_ID) as HTMLLinkElement | null
  if (!link) {
    link = document.createElement("link")
    link.id = LINK_ID
    link.rel = "stylesheet"
    document.head.appendChild(link)
  }
  link.href = `/brands/${brand}.css`
}
