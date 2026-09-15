"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { PRESETS } from "./theme-provider"
import { Check, RotateCcw, Paintbrush } from "lucide-react"
import { Button } from "./ui/button"

export function ThemeCustomizer() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [activePreset, setActivePreset] = React.useState("sakura")
  const [customColor, setCustomColor] = React.useState("#ec4899")

  // Prevent hydration mismatch
  React.useEffect(() => {
    const preset = localStorage.getItem("qverse_theme_preset") || localStorage.getItem("aniverse_theme_preset") || "sakura"
    const color = localStorage.getItem("qverse_primary_color") || localStorage.getItem("aniverse_primary_color") || "#ec4899"
    
    setTimeout(() => {
      setMounted(true)
      setActivePreset(preset)
      if (preset === "custom") {
        setCustomColor(color)
      }
    }, 0)
  }, [])

  const applyPreset = (presetId: string) => {
    setActivePreset(presetId)
    localStorage.setItem("qverse_theme_preset", presetId)
    
    if (presetId === "custom") {
      applyColor(customColor)
      return
    }

    localStorage.removeItem("qverse_primary_color")
    localStorage.removeItem("qverse_primary_fg_color")
    localStorage.removeItem("aniverse_primary_color")
    localStorage.removeItem("aniverse_primary_fg_color")

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

  const applyColor = (hexColor: string) => {
    setCustomColor(hexColor)
    setActivePreset("custom")
    
    // Calculate contrast (YIQ)
    const r = parseInt(hexColor.slice(1, 3), 16)
    const g = parseInt(hexColor.slice(3, 5), 16)
    const b = parseInt(hexColor.slice(5, 7), 16)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
    
    // If it's a very light color, use dark foreground, else white/light foreground
    const fg = yiq >= 150 ? "oklch(0.15 0.05 270)" : "oklch(0.98 0 0)"

    localStorage.setItem("qverse_theme_preset", "custom")
    localStorage.setItem("qverse_primary_color", hexColor)
    localStorage.setItem("qverse_primary_fg_color", fg)

    document.documentElement.style.setProperty("--primary", hexColor)
    document.documentElement.style.setProperty("--ring", hexColor)
    document.documentElement.style.setProperty("--sidebar-primary", hexColor)
    document.documentElement.style.setProperty("--sidebar-ring", hexColor)
    document.documentElement.style.setProperty("--primary-foreground", fg)
    document.documentElement.style.setProperty("--sidebar-primary-foreground", fg)
  }

  const handleReset = () => {
    applyPreset("sakura")
  }

  if (!mounted) {
    // Return a skeleton loading state that matches the UI layout to avoid layout shifts
    return (
      <div className="space-y-6 animate-pulse">
        <div>
          <div className="h-4 w-28 bg-white/10 rounded mb-3" />
          <div className="grid grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square rounded-full bg-white/10" />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-full bg-white/10 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Preset Colors */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Preset Themes
        </h4>
        <div className="grid grid-cols-6 gap-3">
          {PRESETS.map((preset) => {
            const isActive = activePreset === preset.id
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className="group relative aspect-square rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none cursor-pointer"
                style={{ backgroundColor: preset.displayColor }}
                title={preset.name}
              >
                {/* Active Outline */}
                <span
                  className={`absolute -inset-1 rounded-full border-2 transition-all duration-300 ${
                    isActive
                      ? "border-primary scale-100 opacity-100"
                      : "border-transparent scale-75 opacity-0 group-hover:scale-90 group-hover:opacity-40 group-hover:border-white"
                  }`}
                />
                
                {/* Checkmark inside */}
                {isActive && (
                  <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] animate-in zoom-in duration-200" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom Color Selector */}
      <div className="pt-2 border-t border-white/5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Custom Accent Color
        </h4>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 bg-secondary/30 p-2.5 rounded-xl border border-white/5">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
              <input
                type="color"
                value={customColor}
                onChange={(e) => applyColor(e.target.value)}
                className="absolute -inset-2 w-12 h-12 p-0 border-0 cursor-pointer rounded-full"
                title="Choose custom color"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-none">Hex Code</span>
              <span className="text-sm font-mono font-bold text-white uppercase mt-0.5">{customColor}</span>
            </div>
            {activePreset === "custom" && (
              <div className="ml-auto flex items-center gap-1 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                <Paintbrush className="w-3 h-3" />
                Active
              </div>
            )}
          </div>
          
          <Button
            variant="outline"
            size="default"
            onClick={handleReset}
            disabled={activePreset === "sakura"}
            className="h-auto py-3 px-4 shrink-0 rounded-xl gap-2 font-bold hover:bg-white/5 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </div>
      
      {/* Dynamic Live Preview */}
      <div className="p-4 rounded-xl bg-secondary/20 border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
        <h5 className="text-xs font-bold text-white mb-2">Live Preview</h5>
        <div className="flex items-center gap-3">
          <button className="bg-primary text-primary-foreground text-xs font-black px-3 py-1.5 rounded-lg shadow-md transition-all pointer-events-none">
            Primary Button
          </button>
          <span className="text-xs font-semibold text-primary">Accent Link</span>
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    </div>
  )
}
