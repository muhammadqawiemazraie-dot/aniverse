"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Play, X, Clock } from "lucide-react"
import { useContinueWatching } from "@/hooks/use-continue-watching"
import { usePathname } from "next/navigation"

export function ResumeBanner() {
  const { items } = useContinueWatching()
  const [dismissedId, setDismissedId] = React.useState<string | null>(null)
  const pathname = usePathname()

  if (!items || items.length === 0) return null
  const latest = items[0]
  if (!latest) return null

  // Hide banner on login, profile, auth, or utility pages
  const isAuthOrUtilityPage = pathname === "/login" || pathname === "/profile" || pathname?.startsWith("/auth/") || pathname === "/terms" || pathname === "/privacy" || pathname === "/dmca"
  if (isAuthOrUtilityPage) return null

  // Hide banner if user is currently watching this title
  if (pathname && pathname.includes(`/watch/${latest.type}/${latest.id}`)) return null

  // Hide banner if user dismissed this title in current session
  if (dismissedId === `${latest.type}-${latest.id}`) return null

  const watchUrl = `/watch/${latest.type}/${latest.id}${latest.season ? `?s=${latest.season}&e=${latest.episode}` : ''}`
  const episodeLabel = latest.type === "series" ? `Season ${latest.season || 1} · Episode ${latest.episode || 1}` : "Movie"

  return (
    <div className="fixed bottom-6 left-6 z-40 max-w-sm w-[calc(100vw-3rem)] md:w-auto animate-in slide-in-from-bottom-5 duration-500 select-none">
      <div className="relative group bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 text-white shadow-2xl shadow-purple-950/50 rounded-2xl p-3 flex items-center gap-3.5 hover:border-purple-500/60 transition-all">
        {/* Small Poster Thumbnail */}
        <Link href={watchUrl} className="relative aspect-[3/4] w-12 rounded-xl overflow-hidden shrink-0 bg-slate-800 border border-white/10 group-hover:scale-105 transition-transform">
          {latest.poster ? (
            <Image
              src={latest.poster}
              alt={latest.name}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-5 h-5 text-purple-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-purple-500/20 mix-blend-overlay" />
        </Link>

        {/* Title & Episode Info */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-400 uppercase tracking-wider mb-0.5">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>Resume Watching</span>
          </div>
          <h4 className="text-sm font-bold text-slate-100 truncate group-hover:text-purple-300 transition-colors">
            {latest.name}
          </h4>
          <p className="text-xs text-slate-400 truncate">
            {episodeLabel}
          </p>
        </div>

        {/* Resume Button */}
        <Link
          href={watchUrl}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all shrink-0 hover:scale-105 active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Resume</span>
        </Link>

        {/* Dismiss Button */}
        <button
          onClick={() => setDismissedId(`${latest.type}-${latest.id}`)}
          title="Dismiss"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shadow-md"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
