"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Film, Tv, Sparkles, X, ArrowRight, Star } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { SmartImage } from "@/components/smart-image"
import { Badge } from "@/components/ui/badge"
import type { SuggestionItem } from "@/app/api/search/suggestions/route"

interface SearchSpotlightProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SearchSpotlight({ open: externalOpen, onOpenChange }: SearchSpotlightProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen

  const setIsOpen = React.useCallback(
    (val: boolean) => {
      if (onOpenChange) {
        onOpenChange(val)
      } else {
        setInternalOpen(val)
      }
    },
    [onOpenChange]
  )

  const [query, setQuery] = React.useState("")
  const [filterType, setFilterType] = React.useState<"all" | "movie" | "series">("all")
  const [results, setResults] = React.useState<SuggestionItem[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Register Ctrl+S / Cmd+S shortcut globally
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault() // Prevent browser Save Webpage dialog!
        setIsOpen(!isOpen)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, setIsOpen])

  // Focus input when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery("")
      setResults([])
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Fetch suggestions when query changes
  React.useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.suggestions || [])
          setSelectedIndex(0)
        }
      } catch (e) {
        console.error("Search spotlight error", e)
      } finally {
        setIsLoading(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  // Filtered results
  const filteredResults = React.useMemo(() => {
    if (filterType === "all") return results
    return results.filter(r => r.type === filterType)
  }, [results, filterType])

  const handleSelect = (item: SuggestionItem) => {
    setIsOpen(false)
    router.push(`/watch/${item.type}/${item.id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(prev => (filteredResults.length > 0 ? (prev + 1) % filteredResults.length : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(prev => (filteredResults.length > 0 ? (prev - 1 + filteredResults.length) % filteredResults.length : 0))
    } else if (e.key === "Enter" && filteredResults[selectedIndex]) {
      e.preventDefault()
      handleSelect(filteredResults[selectedIndex])
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden bg-card/95 backdrop-blur-2xl border-white/10 shadow-2xl rounded-2xl">
        {/* Search Header */}
        <div className="flex items-center px-4 border-b border-border/50 bg-secondary/20">
          <Search className="w-5 h-5 text-primary shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search Movies, Series, Anime..."
            className="w-full h-14 bg-transparent text-base placeholder:text-muted-foreground outline-none text-foreground font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold font-mono bg-secondary/80 text-muted-foreground rounded border border-border">
            <span>Ctrl</span>
            <span>+</span>
            <span>S</span>
          </kbd>
        </div>

        {/* Filter Category Tabs */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 bg-secondary/10 text-xs">
          {(
            [
              { id: "all", label: "All Types", icon: Sparkles },
              { id: "movie", label: "Movies", icon: Film },
              { id: "series", label: "TV & Anime", icon: Tv },
            ] as const
          ).map(tab => {
            const Icon = tab.icon
            const active = filterType === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {isLoading && (
            <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
              Searching Qverse database...
            </div>
          )}

          {!isLoading && query.trim() && filteredResults.length === 0 && (
            <div className="py-10 text-center space-y-2">
              <Search className="w-8 h-8 text-muted-foreground mx-auto opacity-40" />
              <p className="text-sm font-medium text-foreground">No matches found for &quot;{query}&quot;</p>
              <p className="text-xs text-muted-foreground">Try searching with a different title or keyword.</p>
            </div>
          )}

          {!query.trim() && (
            <div className="py-8 px-4 text-center">
              <p className="text-xs text-muted-foreground">
                Type any movie or anime title to search instantly, or press <kbd className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-secondary rounded border border-border">Esc</kbd> to close.
              </p>
            </div>
          )}

          {!isLoading &&
            filteredResults.map((item, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-primary/15 border border-primary/30 text-foreground"
                      : "hover:bg-secondary/40 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-10 h-14 rounded-md overflow-hidden shrink-0 bg-secondary/50 border border-white/10">
                      <SmartImage
                        src={item.poster}
                        mediaId={item.id}
                        alt={item.name}
                        fallbackTitle={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize border-white/20">
                          {item.type}
                        </Badge>
                        {item.releaseInfo && (
                          <span className="text-muted-foreground text-[11px]">{item.releaseInfo}</span>
                        )}
                        {item.imdbRating && (
                          <span className="flex items-center text-yellow-400 font-bold text-[11px]">
                            <Star className="w-2.5 h-2.5 mr-0.5 fill-current" />
                            {item.imdbRating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? "text-primary translate-x-1" : "opacity-0"}`} />
                </div>
              )
            })}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-2 bg-secondary/30 border-t border-border/40 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span><kbd className="font-bold">↑</kbd> <kbd className="font-bold">↓</kbd> Navigate</span>
            <span><kbd className="font-bold">↵</kbd> Select</span>
            <span><kbd className="font-bold">Esc</kbd> Close</span>
          </div>
          <span className="font-medium text-primary">Qverse Spotlight</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
