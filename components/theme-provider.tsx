"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

export const PRESETS = [
  {
    id: "sakura",
    name: "Sakura (Default)",
    light: "oklch(0.55 0.2 320)",
    dark: "oklch(0.65 0.25 320)",
    fgLight: "oklch(0.98 0 0)",
    fgDark: "oklch(0.98 0 0)",
    displayColor: "#ec4899",
  },
  {
    id: "ocean",
    name: "Ocean Breeze",
    light: "oklch(0.55 0.18 240)",
    dark: "oklch(0.65 0.2 240)",
    fgLight: "oklch(0.98 0 0)",
    fgDark: "oklch(0.98 0 0)",
    displayColor: "#0ea5e9",
  },
  {
    id: "emerald",
    name: "Emerald Neon",
    light: "oklch(0.55 0.18 140)",
    dark: "oklch(0.68 0.22 140)",
    fgLight: "oklch(0.12 0.02 270)",
    fgDark: "oklch(0.12 0.02 270)",
    displayColor: "#10b981",
  },
  {
    id: "violet",
    name: "Royal Violet",
    light: "oklch(0.55 0.2 290)",
    dark: "oklch(0.65 0.25 290)",
    fgLight: "oklch(0.98 0 0)",
    fgDark: "oklch(0.98 0 0)",
    displayColor: "#8b5cf6",
  },
  {
    id: "amber",
    name: "Sunset Amber",
    light: "oklch(0.6 0.18 60)",
    dark: "oklch(0.68 0.2 60)",
    fgLight: "oklch(0.12 0.02 270)",
    fgDark: "oklch(0.12 0.02 270)",
    displayColor: "#f59e0b",
  },
  {
    id: "crimson",
    name: "Crimson Ruby",
    light: "oklch(0.52 0.2 25)",
    dark: "oklch(0.6 0.22 25)",
    fgLight: "oklch(0.98 0 0)",
    fgDark: "oklch(0.98 0 0)",
    displayColor: "#f43f5e",
  }
]

function AccentSync() {
  const { resolvedTheme } = useTheme()

  React.useEffect(() => {
    const presetId = localStorage.getItem("qverse_theme_preset") || localStorage.getItem("aniverse_theme_preset") || "sakura"
    const customColor = localStorage.getItem("qverse_primary_color") || localStorage.getItem("aniverse_primary_color")
    const customFg = localStorage.getItem("qverse_primary_fg_color") || localStorage.getItem("aniverse_primary_fg_color")

    if (presetId === "custom" && customColor) {
      document.documentElement.style.setProperty("--primary", customColor)
      document.documentElement.style.setProperty("--ring", customColor)
      document.documentElement.style.setProperty("--sidebar-primary", customColor)
      document.documentElement.style.setProperty("--sidebar-ring", customColor)
      if (customFg) {
        document.documentElement.style.setProperty("--primary-foreground", customFg)
        document.documentElement.style.setProperty("--sidebar-primary-foreground", customFg)
      }
    } else {
      const preset = PRESETS.find(p => p.id === presetId) || PRESETS[0]
      const isDark = resolvedTheme === "dark"
      const color = isDark ? preset.dark : preset.light
      const fg = isDark ? preset.fgDark : preset.fgLight

      document.documentElement.style.setProperty("--primary", color)
      document.documentElement.style.setProperty("--ring", color)
      document.documentElement.style.setProperty("--sidebar-primary", color)
      document.documentElement.style.setProperty("--sidebar-ring", color)
      document.documentElement.style.setProperty("--primary-foreground", fg)
      document.documentElement.style.setProperty("--sidebar-primary-foreground", fg)
    }
  }, [resolvedTheme])

  return null
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <AccentSync />
      {children}
    </NextThemesProvider>
  )
}
