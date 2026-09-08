"use client"

import * as React from "react"
import { Zap } from "lucide-react"

export function NeonToggle() {
  const [neon, setNeon] = React.useState(false)

  React.useEffect(() => {
    const saved = localStorage.getItem("aniverse_neon") === "true"
    setTimeout(() => setNeon(saved), 0)
    if (saved) document.documentElement.classList.add("neon")
  }, [])

  const toggle = () => {
    const next = !neon
    setNeon(next)
    if (next) {
      document.documentElement.classList.add("neon")
    } else {
      document.documentElement.classList.remove("neon")
    }
    localStorage.setItem("aniverse_neon", String(next))
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle Neon Mode"
      title={neon ? "Disable Neon Mode" : "Enable Neon Mode"}
      className={`inline-flex items-center justify-center h-9 w-9 rounded-full transition-all duration-300 ${
        neon
          ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_12px_rgba(0,255,255,0.5)] border border-cyan-400/50"
          : "hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      <Zap className={`h-4 w-4 ${neon ? "fill-current" : ""}`} />
    </button>
  )
}
