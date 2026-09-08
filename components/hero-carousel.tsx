"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Play, Star, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import type { CinemetaMeta } from "@/lib/cinemeta"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SmartImage } from "@/components/smart-image"
import { ParticleBackground } from "@/components/particle-background"

interface HeroCarouselProps {
  movies: CinemetaMeta[]
}

export function HeroCarousel({ movies }: HeroCarouselProps) {
  const [current, setCurrent] = React.useState(0)
  const [transitioning, setTransitioning] = React.useState(false)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const go = React.useCallback((index: number) => {
    if (transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      setCurrent(index)
      setTransitioning(false)
    }, 300)
  }, [transitioning])

  const next = React.useCallback(() => go((current + 1) % movies.length), [go, current, movies.length])
  const prev = React.useCallback(() => go((current - 1 + movies.length) % movies.length), [go, current, movies.length])

  // Auto-rotate every 6 seconds
  React.useEffect(() => {
    timerRef.current = setTimeout(next, 6000)
    return () => clearTimeout(timerRef.current)
  }, [current, next])

  const hero = movies[current]
  if (!hero) return null

  return (
    <section className="relative h-[85vh] w-full flex items-center overflow-hidden">
      {/* Background layer */}
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-500 ${transitioning ? "opacity-0" : "opacity-100"}`}
      >
        {(hero.background || hero.poster) && (
          <Image
            src={hero.background || hero.poster || ""}
            alt={hero.name}
            fill
            className="object-cover scale-105"
            priority
          />
        )}
        {/* Always-dark gradients so text is readable in both light and dark themes */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Particle overlay */}
      <ParticleBackground />

      {/* Content */}
      <div
        className={`container relative z-10 mx-auto px-4 grid md:grid-cols-2 gap-8 items-center transition-all duration-500 ${
          transitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        }`}
      >
        <div className="flex flex-col gap-5">
          <Badge className="w-fit bg-primary/20 text-primary hover:bg-primary/30 border-primary/50">
            #{current + 1} Trending Movie
          </Badge>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white drop-shadow-2xl leading-tight">
            {hero.name}
          </h1>

          <p className="text-base text-white/75 line-clamp-2 max-w-lg">{hero.description}</p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
            {hero.imdbRating && (
              <span className="flex items-center gap-1 bg-yellow-500/20 px-2 py-0.5 rounded-full border border-yellow-500/30">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" /> {hero.imdbRating}
              </span>
            )}
            {hero.releaseInfo && <span>{hero.releaseInfo}</span>}
            {hero.runtime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {hero.runtime}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1">
            <Button size="lg" className="rounded-full shadow-lg shadow-primary/30 font-semibold" asChild>
              <Link href={`/watch/movie/${hero.id}`}>
                <Play className="w-5 h-5 mr-2 fill-current" />
                Watch Now
              </Link>
            </Button>
            <Button size="lg" variant="secondary" className="rounded-full backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20" asChild>
              <Link href={`/watch/movie/${hero.id}`}>More Info</Link>
            </Button>
          </div>
        </div>

        {/* Poster */}
        <div className="hidden md:flex justify-end">
          <div className="relative w-[260px] h-[390px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 rotate-2 transition-transform duration-700 hover:rotate-0 group">
            <SmartImage
              src={hero.poster}
              alt={hero.name}
              fallbackTitle={hero.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority={current === 0}
            />
            {/* Glass overlay on poster */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/60 transition-all hover:scale-110"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/60 transition-all hover:scale-110"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2 items-center">
        {movies.slice(0, 8).map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`carousel-dot ${i === current ? "active" : ""}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
