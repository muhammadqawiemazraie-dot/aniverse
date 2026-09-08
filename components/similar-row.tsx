"use client"

import * as React from "react"
import { SmartImage } from "@/components/smart-image"
import Link from "next/link"
import { Play, Star } from "lucide-react"
import type { CinemetaMeta } from "@/lib/cinemeta"
import { Badge } from "@/components/ui/badge"

interface SimilarRowProps {
  items: CinemetaMeta[]
  type: 'movie' | 'series'
  currentId: string
}

export function SimilarRow({ items, type, currentId }: SimilarRowProps) {
  const filtered = items.filter(i => i.id !== currentId).slice(0, 12)
  if (filtered.length === 0) return null

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold mb-6">More Like This</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.map(item => (
          <Link
            key={item.id}
            href={`/watch/${type}/${item.id}`}
            className="group flex flex-col gap-2"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-secondary/20">
              <SmartImage
                src={item.poster}
                alt={item.name}
                fallbackTitle={item.name}
                fill
                sizes="(max-width: 768px) 50vw, 17vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <Play className="w-7 h-7 text-white fill-current" />
              </div>
              {item.imdbRating && (
                <Badge className="absolute top-2 left-2 bg-black/60 backdrop-blur-md border-none text-white text-[10px]">
                  <Star className="w-2.5 h-2.5 text-yellow-400 mr-1 fill-current" />
                  {item.imdbRating}
                </Badge>
              )}
            </div>
            <p className="text-xs font-medium line-clamp-1 group-hover:text-primary transition-colors">{item.name}</p>
            <p className="text-[11px] text-muted-foreground">{item.releaseInfo || 'TBA'}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
