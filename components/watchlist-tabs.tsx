"use client"

import * as React from "react"
import { Bookmark, Tv, Clapperboard, Filter } from "lucide-react"

import { MediaCard } from "@/components/media-card"

export interface WatchlistItem {
  id: string
  media_id: string
  media_type: "movie" | "series"
  title: string
  image_url: string | null
  status: string
  created_at: string
}

interface WatchlistTabsProps {
  initialFavorites: WatchlistItem[]
}

const TYPES = [
  { id: "all", label: "All Media", icon: Bookmark },
  { id: "movie", label: "Movies", icon: Clapperboard },
  { id: "series", label: "TV & Anime", icon: Tv },
]

const STATUSES = [
  { id: "all", label: "All Status", colorClass: "bg-secondary text-muted-foreground" },
  { id: "watching", label: "Watching", colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { id: "plan_to_watch", label: "Plan to Watch", colorClass: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20" },
  { id: "completed", label: "Completed", colorClass: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { id: "dropped", label: "Dropped", colorClass: "bg-red-500/10 text-red-400 border-red-500/20" },
]

export function WatchlistTabs({ initialFavorites }: WatchlistTabsProps) {
  const [selectedType, setSelectedType] = React.useState<string>("all")
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all")

  // Filter items
  const filteredItems = React.useMemo(() => {
    return initialFavorites.filter(item => {
      const matchesType = selectedType === "all" || item.media_type === selectedType
      const matchesStatus = selectedStatus === "all" || item.status === selectedStatus
      return matchesType && matchesStatus
    })
  }, [initialFavorites, selectedType, selectedStatus])

  // Count items for tab labels
  const getCountForType = (typeId: string) => {
    return initialFavorites.filter(item => {
      const matchesType = typeId === "all" || item.media_type === typeId
      const matchesStatus = selectedStatus === "all" || item.status === selectedStatus
      return matchesType && matchesStatus
    }).length
  }

  const getCountForStatus = (statusId: string) => {
    return initialFavorites.filter(item => {
      const matchesType = selectedType === "all" || item.media_type === selectedType
      const matchesStatus = statusId === "all" || item.status === statusId
      return matchesType && matchesStatus
    }).length
  }

  const getStatusLabel = (statusId: string) => {
    switch (statusId) {
      case "plan_to_watch": return "Plan to Watch"
      case "watching": return "Watching"
      case "completed": return "Completed"
      case "dropped": return "Dropped"
      default: return "Plan to Watch"
    }
  }

  const getStatusBadgeColor = (statusId: string) => {
    switch (statusId) {
      case "plan_to_watch": return "bg-fuchsia-500/25 border-fuchsia-500/40 text-fuchsia-300"
      case "watching": return "bg-emerald-500/25 border-emerald-500/40 text-emerald-300"
      case "completed": return "bg-blue-500/25 border-blue-500/40 text-blue-300"
      case "dropped": return "bg-red-500/25 border-red-500/40 text-red-300"
      default: return "bg-secondary text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters Area */}
      <div className="flex flex-col gap-4">
        {/* Media Type Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide border-b border-white/5">
          {TYPES.map(t => {
            const Icon = t.icon
            const isActive = selectedType === t.id
            const count = getCountForType(t.id)

            return (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 border text-xs font-semibold ${
                  isActive
                    ? "bg-primary border-primary text-primary-foreground shadow-md"
                    : "bg-secondary/25 hover:bg-secondary/40 border-white/5 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                  isActive ? "bg-black/20 text-white" : "bg-secondary text-muted-foreground"
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Library Status Filter */}
        <div className="flex flex-wrap gap-1.5 items-center bg-secondary/10 p-2 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-primary" />
            Status:
          </div>
          {STATUSES.map(s => {
            const isActive = selectedStatus === s.id
            const count = getCountForStatus(s.id)

            return (
              <button
                key={s.id}
                onClick={() => setSelectedStatus(s.id)}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 text-xs font-semibold border ${
                  isActive
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <span>{s.label}</span>
                <span className="text-[10px] text-muted-foreground/60 ml-1.5">({count})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-secondary/15 rounded-2xl border border-white/5">
          <Bookmark className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-bold">No results found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your category or status filters to find saved items.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredItems.map(item => (
            <div key={item.id} className="relative group">
              <MediaCard
                id={item.media_id}
                type={item.media_type}
                name={item.title}
                poster={item.image_url}
              />
              {/* Status Badge overlay on the card */}
              <div className="absolute top-2 right-2 z-20 pointer-events-none transition-all duration-300">
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-tight border shadow-md uppercase backdrop-blur-md ${
                  getStatusBadgeColor(item.status)
                }`}>
                  {getStatusLabel(item.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
