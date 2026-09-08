"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SlidersHorizontal, X, ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", 
  "Horror", "Romance", "Sci-Fi", "Thriller", "Animation"
]

const DECADES = [
  { label: "Any Year", value: "" },
  { label: "2025+", value: "2025" },
  { label: "2020+", value: "2020" },
  { label: "2010s", value: "2010" },
  { label: "2000s", value: "2000" },
  { label: "90s", value: "1990" },
  { label: "Older", value: "older" }
]

const RATINGS = [
  { label: "Any Rating", value: "" },
  { label: "8.0+ Excellent", value: "8" },
  { label: "7.0+ Good", value: "7" },
  { label: "6.0+ Above Average", value: "6" }
]

const SORTS = [
  { label: "Relevance", value: "relevance" },
  { label: "Rating (High-Low)", value: "rating" },
  { label: "Newest Releases", value: "year" },
  { label: "Alphabetical", value: "name" }
]

export function SearchFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [isOpen, setIsOpen] = React.useState(false)

  // Current values from URL
  const query = searchParams.get("q") || ""
  const activeType = searchParams.get("type") || "all"
  const activeGenre = searchParams.get("genre") || ""
  const activeYear = searchParams.get("year") || ""
  const activeRating = searchParams.get("rating") || ""
  const activeSort = searchParams.get("sort") || "relevance"

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Always reset page when filters change
    params.delete("page")
    router.push(`/search?${params.toString()}`)
  }

  const clearFilters = () => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    router.push(`/search?${params.toString()}`)
  }

  const hasActiveFilters = activeType !== "all" || activeGenre || activeYear || activeRating || activeSort !== "relevance"

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          {/* Main search type tabs */}
          {[
            { label: "All Media", value: "all" },
            { label: "Movies", value: "movie" },
            { label: "TV & Anime", value: "series" },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => handleFilterChange("type", tab.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                activeType === tab.value
                  ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-secondary/30 border-white/5 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs h-8 text-muted-foreground hover:text-white rounded-full flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className={`text-xs h-8 rounded-full flex items-center gap-1.5 border transition-all ${
              isOpen ? "bg-primary/10 border-primary text-primary" : "border-white/5 bg-secondary/30"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> 
            {isOpen ? "Hide Filters" : "Filter & Sort"}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="p-5 rounded-2xl bg-secondary/10 border border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-200">
          {/* Genres */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Genre</label>
            <select
              value={activeGenre}
              onChange={e => handleFilterChange("genre", e.target.value)}
              className="bg-background/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background cursor-pointer"
            >
              <option value="">Any Genre</option>
              {GENRES.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Release Year */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Year</label>
            <select
              value={activeYear}
              onChange={e => handleFilterChange("year", e.target.value)}
              className="bg-background/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background cursor-pointer"
            >
              {DECADES.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Rating */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Min Rating</label>
            <select
              value={activeRating}
              onChange={e => handleFilterChange("rating", e.target.value)}
              className="bg-background/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background cursor-pointer"
            >
              {RATINGS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider flex items-center gap-1">
              <ArrowUpDown className="w-2.5 h-2.5" /> Sort By
            </label>
            <select
              value={activeSort}
              onChange={e => handleFilterChange("sort", e.target.value)}
              className="bg-background/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background cursor-pointer"
            >
              {SORTS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
