"use client"

import * as React from "react"
import { Heart, ChevronDown, Check, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { addFavorite, removeFavorite, getFavoriteStatus } from "@/app/actions/favorites"
import { getUser } from "@/app/actions/auth"

interface FavoriteButtonProps {
  mediaId: string
  mediaType: "movie" | "series"
  title: string
  imageUrl?: string | null
  className?: string
}

const STATUSES = [
  { id: "plan_to_watch", label: "Plan to Watch", colorClass: "text-fuchsia-400 fill-fuchsia-400" },
  { id: "watching", label: "Watching", colorClass: "text-emerald-400 fill-emerald-400" },
  { id: "completed", label: "Completed", colorClass: "text-blue-400 fill-blue-400" },
  { id: "dropped", label: "Dropped", colorClass: "text-red-400 fill-red-400" },
]

export function FavoriteButton({ mediaId, mediaType, title, imageUrl, className = "" }: FavoriteButtonProps) {
  const [activeStatus, setActiveStatus] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const [isPulsing, setIsPulsing] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const router = useRouter()

  React.useEffect(() => {
    getFavoriteStatus(mediaId).then(status => {
      setActiveStatus(status)
      setLoading(false)
    })
  }, [mediaId])

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelectStatus = async (statusId: string) => {
    setDropdownOpen(false)
    setLoading(true)
    setIsPulsing(true)
    setTimeout(() => setIsPulsing(false), 600)

    // Check authorization first
    const user = await getUser()
    if (!user) {
      setLoading(false)
      toast("Please sign in to track items in your library.", {
        action: {
          label: "Sign In",
          onClick: () => router.push("/login")
        }
      })
      return
    }

    const previousStatus = activeStatus
    setActiveStatus(statusId)

    const result = await addFavorite(mediaId, mediaType, title, imageUrl || null, statusId)
    setLoading(false)

    if (result.error) {
      setActiveStatus(previousStatus)
      toast.error(result.error)
    } else {
      const selected = STATUSES.find(s => s.id === statusId)
      toast.success(`Marked "${title}" as ${selected?.label || ""}!`)
    }
  }

  const handleRemove = async () => {
    setDropdownOpen(false)
    setLoading(true)

    const previousStatus = activeStatus
    setActiveStatus(null)

    const result = await removeFavorite(mediaId)
    setLoading(false)

    if (result.error) {
      setActiveStatus(previousStatus)
      toast.error(result.error)
    } else {
      toast.success(`Removed "${title}" from your library.`)
    }
  }

  const getStatusConfig = () => {
    if (!activeStatus) return { colorClass: "text-white/70 hover:scale-110", label: "Add to Library" }
    const match = STATUSES.find(s => s.id === activeStatus)
    if (!match) return { colorClass: "text-white/70", label: "Add to Library" }
    
    return {
      colorClass: match.colorClass,
      label: match.label
    }
  }

  const currentConfig = getStatusConfig()

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <Button
        variant="outline"
        size="icon"
        className={`h-11 w-11 rounded-xl border-white/10 bg-secondary/30 hover:bg-secondary/50 transition-all flex items-center justify-center relative ${className}`}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        disabled={loading}
        title={currentConfig.label}
      >
        <Heart className={`w-5 h-5 transition-all duration-300 ${currentConfig.colorClass} ${isPulsing ? "scale-150 animate-bounce" : ""}`} />
        <ChevronDown className="w-2.5 h-2.5 text-white/40 absolute bottom-1 right-1" />
      </Button>

      {/* Floating Status Selector Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#111] border border-white/10 rounded-xl shadow-2xl p-1.5 z-[60] animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-white/5 mb-1.5">
            Set Library Status
          </div>

          <div className="flex flex-col gap-0.5">
            {STATUSES.map(status => {
              const label = status.label
              const isSelected = activeStatus === status.id

              return (
                <button
                  key={status.id}
                  onClick={() => handleSelectStatus(status.id)}
                  className={`w-full text-left px-2.5 py-2 text-xs font-semibold rounded-lg flex items-center justify-between transition-all ${
                    isSelected
                      ? "bg-primary/20 text-primary"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span>{label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              )
            })}

            {activeStatus && (
              <div className="border-t border-white/5 mt-1 pt-1">
                <button
                  onClick={handleRemove}
                  className="w-full text-left px-2.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-lg flex items-center justify-between transition-all"
                >
                  <span>Remove from Library</span>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
