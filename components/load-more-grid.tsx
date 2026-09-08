"use client"

import * as React from "react"
import { Loader2, ChevronDown } from "lucide-react"
import { MediaCard } from "@/components/media-card"
import { SkeletonCard } from "@/components/skeleton-card"
import { Button } from "@/components/ui/button"
import type { CinemetaMeta } from "@/lib/cinemeta"

interface LoadMoreGridProps {
  initialItems: CinemetaMeta[]
  type: "movie" | "series"
}

const PAGE_SIZE = 100 // Cinemeta returns 100 items per page

export function LoadMoreGrid({ initialItems, type }: LoadMoreGridProps) {
  const [items, setItems] = React.useState<CinemetaMeta[]>(initialItems)
  const [loading, setLoading] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(initialItems.length >= 10)
  const [skip, setSkip] = React.useState(PAGE_SIZE)

  const loadMore = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/trending?type=${type}&skip=${skip}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data: CinemetaMeta[] = await res.json()
      if (data.length === 0) {
        setHasMore(false)
      } else {
        setItems(prev => [...prev, ...data])
        setSkip(prev => prev + PAGE_SIZE)
        if (data.length < 10) setHasMore(false)
      }
    } catch {
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {items.map(item => (
          <MediaCard
            key={item.id}
            id={item.id}
            type={type}
            name={item.name}
            poster={item.poster}
            releaseInfo={item.releaseInfo}
            imdbRating={item.imdbRating}
          />
        ))}
        {/* Skeleton placeholders while loading more — prevents layout pop-in */}
        {loading && Array.from({ length: 10 }).map((_, i) => (
          <SkeletonCard key={`skel-${i}`} />
        ))}
      </div>

      {hasMore && !loading && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={loadMore}
            className="gap-2 rounded-full border-border/60 hover:border-primary/60 hover:text-primary transition-all px-8"
          >
            <ChevronDown className="w-4 h-4" />
            Load More
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading more...
          </div>
        </div>
      )}
    </div>
  )
}
