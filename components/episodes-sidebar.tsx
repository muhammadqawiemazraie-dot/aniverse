"use client"

import * as React from "react"
import Link from "next/link"
import { Search, BadgeAlert, Check } from "lucide-react"

import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { EpisodeThumbnail } from "@/components/episode-thumbnail"

interface CinemetaVideo {
  id: string
  title?: string
  name?: string
  season: number
  episode: number
  thumbnail?: string
}

interface EpisodesSidebarProps {
  videos: CinemetaVideo[]
  season: number
  episode: number
  type: "movie" | "series"
  id: string
  seasons: number[]
  fallbackPoster?: string | null
}

const CHUNK_SIZE = 100

export function EpisodesSidebar({ videos, season, episode, type, id, fallbackPoster }: EpisodesSidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [watchedSet, setWatchedSet] = React.useState<Set<string>>(new Set())

  // Load and update watched episodes history for this show
  React.useEffect(() => {
    try {
      const storageKey = `aniverse_episodes_${id}`
      const raw = localStorage.getItem(storageKey)
      const currentKey = `${season}-${episode}`
      let set = new Set<string>()
      if (raw) {
        set = new Set(JSON.parse(raw))
      }
      set.add(currentKey)
      localStorage.setItem(storageKey, JSON.stringify(Array.from(set)))
      setWatchedSet(set)
    } catch (e) {
      console.error("Failed to update watched episodes:", e)
    }
  }, [id, season, episode])
  
  // Sort all videos chronologically by season and then episode
  const sortedAllVideos = React.useMemo(() => {
    return [...videos].sort((a, b) => {
      if (a.season !== b.season) return a.season - b.season
      return a.episode - b.episode
    })
  }, [videos])

  // Separate regular episodes and specials
  const { regularEpisodes, specials } = React.useMemo(() => {
    const regular: (CinemetaVideo & { absoluteNumber: number })[] = []
    const spec: CinemetaVideo[] = []
    
    let absoluteCount = 1
    for (const v of sortedAllVideos) {
      if (v.season === 0) {
        spec.push(v)
      } else {
        regular.push({
          ...v,
          absoluteNumber: absoluteCount++
        })
      }
    }
    return { regularEpisodes: regular, specials: spec }
  }, [sortedAllVideos])

  // Find distinct seasons (excluding Specials season 0)
  const seasonNumbers = React.useMemo(() => {
    const seasons = new Set<number>()
    videos.forEach(v => {
      if (v.season > 0) seasons.add(v.season)
    })
    return Array.from(seasons).sort((a, b) => a - b)
  }, [videos])

  // Determine if it should be chunked (long running series like One Piece)
  // or season-grouped (normal series like Attack on Titan)
  const useChunking = React.useMemo(() => {
    const countPerSeason: Record<number, number> = {}
    let maxEpisodesInAnySeason = 0
    videos.forEach(v => {
      if (v.season > 0) {
        countPerSeason[v.season] = (countPerSeason[v.season] || 0) + 1
        if (countPerSeason[v.season] > maxEpisodesInAnySeason) {
          maxEpisodesInAnySeason = countPerSeason[v.season]
        }
      }
    })

    const totalRegular = videos.filter(v => v.season > 0).length
    // If any season has > 80 episodes, OR if total regular episodes > 120 and distinct seasons <= 2
    return maxEpisodesInAnySeason > 80 || (totalRegular > 120 && seasonNumbers.length <= 2)
  }, [videos, seasonNumbers])

  // Split episodes into chunks or season tabs
  const chunks = React.useMemo(() => {
    const res = []
    
    if (useChunking) {
      // Chunk-based grouping (e.g. 1-100)
      for (let i = 0; i < regularEpisodes.length; i += CHUNK_SIZE) {
        const slice = regularEpisodes.slice(i, i + CHUNK_SIZE)
        const start = slice[0].absoluteNumber
        const end = slice[slice.length - 1].absoluteNumber
        res.push({
          label: `${start} - ${end}`,
          episodes: slice,
          isSpecials: false,
        })
      }
    } else {
      // Season-based grouping (e.g. Season 1, Season 2)
      seasonNumbers.forEach(sNum => {
        const seasonVids = regularEpisodes.filter(v => v.season === sNum)
        if (seasonVids.length > 0) {
          res.push({
            label: `Season ${sNum}`,
            episodes: seasonVids,
            isSpecials: false,
          })
        }
      })
    }
    
    // Specials chunk (if any)
    if (specials.length > 0) {
      res.push({
        label: "Specials",
        episodes: specials.map(s => ({ ...s, absoluteNumber: s.episode })),
        isSpecials: true,
      })
    }
    
    return res
  }, [useChunking, regularEpisodes, specials, seasonNumbers])

  // Determine initial active chunk containing the playing episode
  const [activeChunkIndex, setActiveChunkIndex] = React.useState(() => {
    if (chunks.length > 0) {
      const idx = chunks.findIndex(chunk => 
        chunk.episodes.some(ep => ep.season === season && ep.episode === episode)
      )
      return idx !== -1 ? idx : 0
    }
    return 0
  })

  // Sync active chunk when season/episode props change
  React.useEffect(() => {
    const activeIdx = chunks.findIndex(chunk => 
      chunk.episodes.some(ep => ep.season === season && ep.episode === episode)
    )
    if (activeIdx !== -1) {
      setActiveChunkIndex(activeIdx)
    }
  }, [season, episode, chunks])

  // Filter episodes based on search query
  const displayedEpisodes = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return chunks[activeChunkIndex]?.episodes || []
    }

    const cleanQuery = searchQuery.toLowerCase().trim()
    const queryNum = parseInt(cleanQuery)

    // Search across all regular episodes and specials
    const allSearchable = [
      ...regularEpisodes,
      ...specials.map(s => ({ ...s, absoluteNumber: s.episode }))
    ]

    return allSearchable.filter(v => {
      const titleText = (v.name || v.title || "").toLowerCase()
      if (!isNaN(queryNum)) {
        return v.absoluteNumber === queryNum || v.episode === queryNum
      }
      return (
        titleText.includes(cleanQuery) || 
        `episode ${v.absoluteNumber}`.includes(cleanQuery) ||
        `episode ${v.episode}`.includes(cleanQuery)
      )
    })
  }, [regularEpisodes, specials, chunks, activeChunkIndex, searchQuery])

  const totalEpisodesCount = regularEpisodes.length > 0 ? regularEpisodes.length : specials.length

  return (
    <div className="bg-secondary/10 rounded-2xl border border-white/8 overflow-hidden flex flex-col h-full min-h-[580px]">
      {/* Title */}
      <div className="p-4 border-b border-white/8 flex items-center justify-between">
        <h2 className="font-bold text-base flex items-center gap-2">
          Episodes
          <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-xs">
            {totalEpisodesCount}
          </Badge>
        </h2>
      </div>

      {/* Chunk / Tab selection pills (only if total episodes exceeds CHUNK_SIZE and no active search) */}
      {chunks.length > 1 && !searchQuery.trim() && (
        <div className="flex gap-1.5 p-3 border-b border-white/8 overflow-x-auto scrollbar-hide bg-secondary/5">
          {chunks.map((chunk, idx) => {
            const isActive = idx === activeChunkIndex
            return (
              <button
                key={idx}
                onClick={() => setActiveChunkIndex(idx)}
                className={`flex-shrink-0 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-white"
                }`}
              >
                {chunk.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Episode search input */}
      <div className="p-3 border-b border-white/8 bg-secondary/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Type episode number (e.g. 1015)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-9 text-xs bg-black/30 border-white/5 focus-visible:ring-primary focus-visible:bg-black/60 rounded-xl transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white text-xs font-bold transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Episodes scroll area */}
      <ScrollArea className="flex-1 max-h-[420px] md:max-h-[500px]">
        <div className="p-3 flex flex-col gap-1.5">
          {displayedEpisodes.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center gap-2">
              <BadgeAlert className="w-8 h-8 text-muted-foreground/45" />
              <p className="text-xs text-muted-foreground">No matching episodes found.</p>
            </div>
          ) : (
            displayedEpisodes.map((vid) => {
              const isActive = vid.season === season && vid.episode === episode
              const isWatched = watchedSet.has(`${vid.season}-${vid.episode}`)
              const poster = vid.thumbnail
              const epDisplayNum = useChunking ? vid.absoluteNumber : vid.episode
              const epTitle = vid.name || vid.title || `Episode ${epDisplayNum}`

              return (
                <Link
                  key={vid.id}
                  href={`/watch/${type}/${id}?s=${vid.season}&e=${vid.episode}`}
                  className={`group p-2.5 rounded-xl border transition-all duration-200 flex gap-3 items-center ${
                    isActive
                      ? "bg-primary/15 border-primary/50 text-primary"
                      : "bg-background/30 border-transparent hover:bg-secondary/40 hover:border-white/10"
                  }`}
                >
                  <EpisodeThumbnail
                    src={poster}
                    fallbackSrc={fallbackPoster}
                    episode={epDisplayNum}
                    isActive={isActive}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                      <span className="text-xs text-muted-foreground font-semibold">
                        {vid.season === 0 ? "Special" : `Episode ${epDisplayNum}`}
                      </span>
                      {isWatched && !isActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                          <Check className="w-2.5 h-2.5" /> Watched
                        </span>
                      )}
                    </div>
                    <div className={`text-xs sm:text-sm font-medium line-clamp-2 leading-tight ${isActive ? "text-primary font-bold" : ""}`}>
                      {epTitle}
                    </div>
                    {vid.season > 0 && (
                      <div className="text-[10px] text-muted-foreground/60 mt-0.5 font-medium">
                        Season {vid.season} · Ep {vid.episode}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
