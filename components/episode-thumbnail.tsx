"use client"

import { useState, useEffect } from "react"

interface EpisodeThumbnailProps {
  src?: string | null
  fallbackSrc?: string | null
  episode: number
  isActive: boolean
}

export function EpisodeThumbnail({ src, fallbackSrc, episode, isActive }: EpisodeThumbnailProps) {
  const [mounted, setMounted] = useState(false)
  const [failed, setFailed] = useState(false)
  const [fallbackFailed, setFallbackFailed] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const showFallbackImage = mounted && failed && fallbackSrc && !fallbackFailed
  const showTextFallback = !mounted || !src || (failed && (!fallbackSrc || fallbackFailed))

  return (
    <div className="relative w-20 h-[52px] rounded-lg overflow-hidden flex-shrink-0 bg-secondary/60">
      {mounted && src && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Episode ${episode}`}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}

      {/* Fallback backdrop/poster if primary fails */}
      {mounted && showFallbackImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fallbackSrc!}
          alt={`Episode ${episode}`}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setFallbackFailed(true)}
        />
      )}

      {/* Fallback gradient tile */}
      {showTextFallback && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center ${
            isActive
              ? "bg-gradient-to-br from-primary/60 to-purple-700/60 text-white"
              : "bg-gradient-to-br from-secondary to-secondary/40 text-muted-foreground"
          }`}
        >
          <span className="text-lg font-black leading-none">{episode}</span>
          <span className="text-[9px] uppercase tracking-widest opacity-60 mt-0.5">EP</span>
        </div>
      )}

      {/* Now-playing animated bars */}
      {isActive && !showTextFallback && (
        <div className="absolute inset-0 bg-primary/30 flex items-center justify-center pointer-events-none">
          <div className="flex gap-0.5 items-end h-4">
            <span className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: "60%", animationDelay: "0s" }} />
            <span className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: "100%", animationDelay: "0.2s" }} />
            <span className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: "80%", animationDelay: "0.1s" }} />
          </div>
        </div>
      )}
    </div>
  )
}
