"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, History } from "lucide-react"
import { useRecentlyViewed } from "@/hooks/use-recently-viewed"
import { Badge } from "@/components/ui/badge"

export function RecentlyViewedRow() {
  const { items } = useRecentlyViewed()

  if (items.length === 0) return null

  return (
    <section className="container mx-auto px-4">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-primary" />
          Recently Viewed
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.slice(0, 12).map(item => (
          <Link
            key={`${item.type}-${item.id}`}
            href={`/watch/${item.type}/${item.id}`}
            className="group flex flex-col gap-2"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-secondary/20">
              {item.poster ? (
                <Image
                  src={item.poster}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 17vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-secondary/50" />
              )}
              {item.imdbRating && (
                <Badge className="absolute top-2 left-2 bg-black/60 backdrop-blur-md border-none text-white text-[10px] font-semibold">
                  <Star className="w-2.5 h-2.5 text-yellow-400 mr-1 fill-current" />
                  {item.imdbRating}
                </Badge>
              )}
            </div>
            <p className="text-xs font-medium line-clamp-1 group-hover:text-primary transition-colors">
              {item.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
