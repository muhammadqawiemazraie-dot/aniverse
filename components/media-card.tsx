"use client"

import Link from "next/link"
import { Play, Star } from "lucide-react"
import { SmartImage } from "@/components/smart-image"
import { Badge } from "@/components/ui/badge"
import { TiltCard } from "@/components/tilt-card"

interface MediaCardProps {
  id: string
  type: "movie" | "series"
  name: string
  poster?: string | null
  releaseInfo?: string | null
  imdbRating?: string | null
  rank?: number
  showType?: boolean
  className?: string
}

function getRatingColor(rating?: string | null, type?: string) {
  if (!rating) return "border-border/40"
  const n = parseFloat(rating)
  if (n >= 8) return "border-emerald-500/60"
  if (n >= 6) return "border-yellow-500/50"
  return "border-red-500/40"
}

export function MediaCard({
  id, type, name, poster, releaseInfo, imdbRating, rank, showType = false, className = ""
}: MediaCardProps) {
  const ratingBorder = getRatingColor(imdbRating, type)

  return (
    <TiltCard className={className}>
      <Link href={`/watch/${type}/${id}`} className="group flex flex-col gap-2">
        <div className={`relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-secondary/20 glass-card border-b-2 ${ratingBorder}`}>
          <SmartImage
            src={poster}
            mediaId={id}
            alt={name}
            fallbackTitle={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 17vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-start justify-end p-3 gap-1">
            <Play className="w-9 h-9 text-white fill-current drop-shadow-lg" />
            <span className="text-white text-xs font-medium line-clamp-1">{name}</span>
          </div>

          {/* Rank badge */}
          {rank !== undefined && (
            <div className="absolute -bottom-1 -left-1 text-[72px] font-black leading-none select-none pointer-events-none"
              style={{ WebkitTextStroke: "2px rgba(255,255,255,0.15)", color: "transparent" }}>
              {rank}
            </div>
          )}

          {/* Rating badge — show N/A when missing on browse page for visual consistency */}
          {imdbRating ? (
            <Badge className="absolute top-2 left-2 bg-black/60 backdrop-blur-md border-none text-white text-[10px] font-bold px-1.5 py-0.5">
              <Star className="w-2.5 h-2.5 text-yellow-400 mr-1 fill-current" />
              {imdbRating}
            </Badge>
          ) : showType ? (
            <Badge className="absolute top-2 left-2 bg-black/40 backdrop-blur-md border-none text-white/40 text-[10px] font-bold px-1.5 py-0.5">
              <Star className="w-2.5 h-2.5 text-white/30 mr-1" />
              N/A
            </Badge>
          ) : null}

          {/* Type badge */}
          {showType && (
            <Badge className="absolute top-2 right-2 bg-primary/70 backdrop-blur-md border-none text-white text-[10px] capitalize">
              {type}
            </Badge>
          )}
        </div>

        <div className="px-0.5">
          <h3 className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors leading-tight">
            {name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {releaseInfo || "TBA"}{showType ? ` • ${type}` : ""}
          </p>
        </div>
      </Link>
    </TiltCard>
  )
}
