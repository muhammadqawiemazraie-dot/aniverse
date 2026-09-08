"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Play, X, Clock, Tv } from "lucide-react"
import { useContinueWatching } from "@/hooks/use-continue-watching"
import { toast } from "sonner"

const GHOST_COUNT = 4 // minimum visible slots

export function ContinueWatchingRow() {
  const { items, removeItem, clearAll } = useContinueWatching()

  if (items.length === 0) return null

  const ghostsNeeded = Math.max(0, GHOST_COUNT - items.length)

  return (
    <section className="container mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" />
          Continue Watching
        </h2>
        <button
          onClick={() => { clearAll(); toast.success("Watch history cleared") }}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          Clear All
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {items.map(item => (
          <div key={`${item.type}-${item.id}`} className="relative flex-shrink-0 w-[150px] group">
            <Link href={`/watch/${item.type}/${item.id}${item.season ? `?s=${item.season}&e=${item.episode}` : ''}`}>
              <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-secondary/20">
                {item.poster ? (
                  <Image
                    src={item.poster}
                    alt={item.name}
                    fill
                    sizes="150px"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
                    <Play className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                  </div>
                </div>
                {item.season && (
                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 rounded-md px-1.5 py-0.5 text-[10px] text-white text-center">
                    S{item.season} E{item.episode}
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs font-medium line-clamp-1">{item.name}</p>
            </Link>
            <button
              onClick={() => { removeItem(item.id, item.type); toast("Removed from continue watching") }}
              className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ))}

        {/* Ghost placeholder slots when fewer than GHOST_COUNT items */}
        {Array.from({ length: ghostsNeeded }).map((_, i) => (
          <div
            key={`ghost-${i}`}
            className="flex-shrink-0 w-[150px] opacity-40"
          >
            <div className="aspect-[3/4] w-full rounded-xl bg-secondary/20 border border-dashed border-border/40 flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
              <Tv className="w-6 h-6" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground/40 text-center">
              {i === 0 ? "Watch more to fill" : "—"}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
