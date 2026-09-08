"use client"

import * as React from "react"
import { SmartImage } from "@/components/smart-image"
import Link from "next/link"
import { Play, Star, ChevronLeft, ChevronRight } from "lucide-react"
import type { CinemetaMeta } from "@/lib/cinemeta"
import { Badge } from "@/components/ui/badge"

interface Top10RowProps {
  items: CinemetaMeta[]
  type: 'movie' | 'series'
  label: string
}

export function Top10Row({ items, type, label }: Top10RowProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(true)

  const updateScrollState = React.useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  React.useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    el?.addEventListener("scroll", updateScrollState, { passive: true })
    return () => el?.removeEventListener("scroll", updateScrollState)
  }, [updateScrollState])

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -500 : 500, behavior: "smooth" })
  }

  return (
    <section className="container mx-auto px-4">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold tracking-tight">{label}</h2>
        <Badge className="bg-primary/20 text-primary border-primary/40 font-bold">TOP 10</Badge>
      </div>

      {/* Scrollable wrapper with hover-reveal arrows */}
      <div className="relative group/row">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          aria-label="Scroll left"
          className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 h-10 w-10 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 opacity-0 group-hover/row:opacity-100 ${
            canScrollLeft ? "" : "pointer-events-none !opacity-0"
          }`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          aria-label="Scroll right"
          className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 h-10 w-10 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 opacity-0 group-hover/row:opacity-100 ${
            canScrollRight ? "" : "pointer-events-none !opacity-0"
          }`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {items.slice(0, 10).map((item, index) => (
            <Link
              key={item.id}
              href={`/watch/${type}/${item.id}`}
              className="relative flex-shrink-0 w-[160px] group"
            >
              {/* Big rank number */}
              <div
                className="absolute -left-2 bottom-12 z-10 text-[80px] font-black leading-none select-none"
                style={{
                  color: "transparent",
                  WebkitTextStroke: "2px hsl(var(--muted-foreground))",
                  opacity: 0.6,
                }}
              >
                {index + 1}
              </div>
              <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-secondary/20 ml-4">
                <SmartImage
                  src={item.poster}
                  alt={item.name}
                  fallbackTitle={item.name}
                  fill
                  sizes="160px"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <Play className="w-8 h-8 text-white fill-current" />
                </div>
                {item.imdbRating && (
                  <Badge className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border-none text-white text-[10px]">
                    <Star className="w-2.5 h-2.5 text-yellow-400 mr-1 fill-current" />
                    {item.imdbRating}
                  </Badge>
                )}
              </div>
              <p className="mt-2 ml-4 text-xs font-medium line-clamp-1 group-hover:text-primary transition-colors">
                {item.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
