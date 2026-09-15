"use client"

import * as React from "react"
import { Server, Monitor, Lightbulb, HelpCircle, SkipForward, X, Tv } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { DownloadButton } from "@/components/download-button"

interface VideoPlayerProps {
  imdbId: string
  type: 'movie' | 'series'
  season?: number
  episode?: number
  title: string
  absoluteEpisode?: number
}

export function VideoPlayer({ imdbId, type, season, episode, title, absoluteEpisode }: VideoPlayerProps) {
  // One Piece IMDb metadata-to-TMDB mapping
  let finalSeason = season || 1
  let finalEpisode = episode || 1

  if (imdbId === "tt0388629" && absoluteEpisode) {
    const tmdbSeasons = [
      { season: 1, start: 1, end: 61 },
      { season: 2, start: 62, end: 77 },
      { season: 3, start: 78, end: 92 },
      { season: 4, start: 93, end: 130 },
      { season: 5, start: 131, end: 143 },
      { season: 6, start: 144, end: 195 },
      { season: 7, start: 196, end: 228 },
      { season: 8, start: 229, end: 263 },
      { season: 9, start: 264, end: 336 },
      { season: 10, start: 337, end: 381 },
      { season: 11, start: 382, end: 407 },
      { season: 12, start: 408, end: 458 },
      { season: 13, start: 459, end: 516 },
      { season: 14, start: 517, end: 578 },
      { season: 15, start: 579, end: 628 },
      { season: 16, start: 629, end: 689 },
      { season: 17, start: 690, end: 750 },
      { season: 18, start: 751, end: 782 },
      { season: 19, start: 783, end: 891 },
      { season: 20, start: 892, end: 1088 },
      { season: 21, start: 1089, end: 1154 },
      { season: 22, start: 1155, end: 9999 }
    ]

    const match = tmdbSeasons.find(s => absoluteEpisode >= s.start && absoluteEpisode <= s.end)
    if (match) {
      finalSeason = match.season
      finalEpisode = absoluteEpisode - match.start + 1
    }
  }

  const SERVERS = [
    { 
      id: "vidsrc.to", 
      name: "VidSrc.to", 
      url: type === 'movie' 
        ? `https://vidsrc.to/embed/movie/${imdbId}` 
        : `https://vidsrc.to/embed/tv/${imdbId}/${finalSeason}/${finalEpisode}` 
    },
    { 
      id: "vidsrc.me", 
      name: "VidSrc.me", 
      url: type === 'movie' 
        ? `https://vidsrc.me/embed/movie?imdb=${imdbId}` 
        : `https://vidsrc.me/embed/tv?imdb=${imdbId}&season=${finalSeason}&episode=${finalEpisode}` 
    },
    { 
      id: "vidlink.pro", 
      name: "VidLink", 
      url: type === 'movie' 
        ? `https://vidlink.pro/movie/${imdbId}` 
        : `https://vidlink.pro/tv/${imdbId}/${finalSeason}/${finalEpisode}` 
    },
    { 
      id: "superembed", 
      name: "SuperEmbed", 
      url: type === 'movie' 
        ? `https://multiembed.mov/?video_id=${imdbId}&tmdb=0` 
        : `https://multiembed.mov/?video_id=${imdbId}&tmdb=0&s=${finalSeason}&e=${finalEpisode}` 
    },
  ]

  // Initialize server from localStorage if present during render-initialization phase (avoids useEffect setState error)
  const [selectedServerId, setSelectedServerId] = React.useState(() => {
    if (typeof window !== "undefined") {
      const savedServerId = localStorage.getItem("qverse-preferred-server") || localStorage.getItem("aniverse-preferred-server")
      if (savedServerId) {
        return savedServerId
      }
    }
    return "vidsrc.to"
  })

  // Ensure selectedServerId exists in servers list, fallback if needed
  const selectedServer = SERVERS.find(s => s.id === selectedServerId) || SERVERS[0]

  const [isLoading, setIsLoading] = React.useState(true)
  const [showAdblockWarning, setShowAdblockWarning] = React.useState(false)
  const [isTheater, setIsTheater] = React.useState(false)
  const [isLightsDimmed, setIsLightsDimmed] = React.useState(false)
  const playerRef = React.useRef<HTMLDivElement>(null)
  const iframeRef = React.useRef<HTMLIFrameElement>(null)
  const [showHotkeys, setShowHotkeys] = React.useState(false)
  const [showSkipIntro, setShowSkipIntro] = React.useState(false)
  const [skipIntroDismissed, setSkipIntroDismissed] = React.useState(false)
  const [showCastModal, setShowCastModal] = React.useState(false)

  const handleCastToTV = () => {
    // 1. Check Google Cast framework SDK
    if (typeof window !== "undefined" && window.cast?.framework && window.chrome?.cast) {
      try {
        const castContext = window.cast.framework.CastContext.getInstance()
        castContext.requestSession().then(
          () => {
            toast.success("Connecting to Chromecast / Smart TV...")
          },
          (err: unknown) => {
            if (err !== "cancel") {
              setShowCastModal(true)
            }
          }
        )
        return
      } catch {
        // Fallback if cast context fails
      }
    }

    // 2. Check AirPlay target picker for Apple Safari devices
    if (iframeRef.current && "webkitShowPlaybackTargetPicker" in iframeRef.current) {
      try {
        (iframeRef.current as unknown as { webkitShowPlaybackTargetPicker: () => void }).webkitShowPlaybackTargetPicker()
        return
      } catch {
        // Fallback
      }
    }

    // 3. Show Cast guidance modal
    setShowCastModal(true)
  }

  // Reset loading states when URL changes
  React.useEffect(() => {
    setIsLoading(true)
    setShowAdblockWarning(false)
  }, [selectedServer.url])

  // Hotkey listener for video player controls (F = Theater, L = Lights Out, S = Next Server)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore hotkeys if user is typing in an input/textarea
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) return

      if (e.key.toLowerCase() === "f") {
        e.preventDefault()
        toggleTheater()
      } else if (e.key.toLowerCase() === "l") {
        e.preventDefault()
        setIsLightsDimmed(prev => !prev)
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault()
        const currentIndex = SERVERS.findIndex(s => s.id === selectedServerId)
        const nextIndex = (currentIndex + 1) % SERVERS.length
        handleServerChange(SERVERS[nextIndex])
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedServerId, isTheater])

  // Auto-failover suggestion if loading exceeds 8s
  React.useEffect(() => {
    if (!isLoading) return
    const failoverTimer = setTimeout(() => {
      setShowAdblockWarning(true)
    }, 5000)
    return () => clearTimeout(failoverTimer)
  }, [isLoading, selectedServer.url])

  // Show skip intro button 5s after player finishes loading
  React.useEffect(() => {
    if (isLoading || skipIntroDismissed) return
    setShowSkipIntro(false)
    const t1 = setTimeout(() => setShowSkipIntro(true), 5000)
    // Auto-hide after 8 more seconds
    const t2 = setTimeout(() => setShowSkipIntro(false), 13000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [isLoading, selectedServer.url, skipIntroDismissed])

  // Cleanup theater mode on unmount
  React.useEffect(() => {
    return () => {
      document.body.classList.remove("theater-active")
    }
  }, [])

  // Auto-center the video player when lights are dimmed
  React.useEffect(() => {
    if (isLightsDimmed && playerRef.current) {
      setTimeout(() => {
        playerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 50)
    }
  }, [isLightsDimmed])

  const handleServerChange = (server: typeof SERVERS[0]) => {
    setIsLoading(true)
    setSelectedServerId(server.id)
    localStorage.setItem("qverse-preferred-server", server.id)
  }

  const toggleTheater = () => {
    const nextState = !isTheater
    setIsTheater(nextState)
    if (nextState) {
      document.body.classList.add("theater-active")
      setTimeout(() => {
        playerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 50)
    } else {
      document.body.classList.remove("theater-active")
    }
  }

  const handleSkipIntro = () => {
    setShowSkipIntro(false)
    setSkipIntroDismissed(true)
    // Attempt postMessage for embeds that support it
    try {
      iframeRef.current?.contentWindow?.postMessage({ action: "skipIntro" }, "*")
    } catch { /* unsupported embed, no-op */ }
  }

  return (
    <div className="flex flex-col gap-4 w-full" ref={playerRef}>
      {/* Lights out overlay */}
      {isLightsDimmed && (
        <div 
          className="fixed inset-0 bg-black/90 z-[49] cursor-pointer transition-opacity duration-300 backdrop-blur-sm"
          onClick={() => setIsLightsDimmed(false)}
        />
      )}

      {/* Server Selector & Player Controls */}
      <div className="flex flex-wrap gap-2 items-center justify-between bg-secondary/30 p-2 rounded-lg border border-border/50 relative z-50">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Server className="w-3 h-3" />
            Servers:
          </div>
          {SERVERS.map((server) => (
            <Button
              key={server.id}
              variant={selectedServerId === server.id ? "default" : "secondary"}
              size="sm"
              className="h-8 text-xs rounded-md transition-all"
              onClick={() => handleServerChange(server)}
            >
              {server.name}
            </Button>
          ))}
        </div>

          <div className="flex items-center gap-1.5 px-2">
            <Button
              variant={isLightsDimmed ? "default" : "secondary"}
              size="sm"
              className="h-8 text-xs rounded-md flex items-center gap-1.5"
              onClick={() => setIsLightsDimmed(!isLightsDimmed)}
              title="Lights Out"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lights Out</span>
            </Button>

            <Button
              variant={isTheater ? "default" : "secondary"}
              size="sm"
              className="h-8 text-xs rounded-md flex items-center gap-1.5"
              onClick={toggleTheater}
              title="Theater Mode"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Theater Mode</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="h-8 text-xs rounded-md flex items-center gap-1.5 hover:bg-primary/20 hover:text-primary transition-all"
              onClick={handleCastToTV}
              title="Cast to TV"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cast to TV</span>
            </Button>

            <DownloadButton
              imdbId={imdbId}
              type={type}
              season={finalSeason}
              episode={finalEpisode}
              title={title}
              variant="default"
              className="h-8 text-xs rounded-md font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow transition-all"
            />

            {/* Keyboard shortcut help */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-md text-muted-foreground hover:text-foreground"
                onClick={() => setShowHotkeys(prev => !prev)}
                title="Keyboard Shortcuts"
                aria-label="Show keyboard shortcuts"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
              {showHotkeys && (
                <div className="absolute bottom-full right-0 mb-2 w-52 bg-card border border-border rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">Shortcuts</span>
                    <button onClick={() => setShowHotkeys(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <ul className="space-y-1.5">
                    {[
                      { key: "F", desc: "Toggle Theater Mode" },
                      { key: "L", desc: "Lights Out" },
                      { key: "S", desc: "Next Server" },
                    ].map(({ key, desc }) => (
                      <li key={key} className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground">{desc}</span>
                        <kbd className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-secondary border border-border rounded text-foreground">{key}</kbd>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Video Iframe Container */}
      <div 
        className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-border/50 group ${
          isLightsDimmed ? "z-50 ring-2 ring-primary/40 shadow-[0_0_50px_rgba(var(--primary),0.3)]" : "relative z-10"
        }`}
      >
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 backdrop-blur-sm p-6 text-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-muted-foreground animate-pulse mb-2">Initializing {selectedServer.name}...</p>
            
            {showAdblockWarning && (
              <div className="max-w-xs mt-2 animate-in fade-in duration-300">
                <p className="text-xs text-yellow-500/90 font-medium mb-3">
                  ⚠️ Taking too long? Third-party players are often blocked by Adblockers/Shields or can be slow to boot.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[10px] h-7 font-bold border-white/10 hover:bg-white/5"
                    onClick={() => setIsLoading(false)}
                  >
                    Force Open Player
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[10px] h-7 font-bold border-white/10 hover:bg-white/5"
                    onClick={() => {
                      const currentIndex = SERVERS.findIndex(s => s.id === selectedServerId)
                      const nextIndex = (currentIndex + 1) % SERVERS.length
                      handleServerChange(SERVERS[nextIndex])
                    }}
                  >
                    Try Next Server
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={selectedServer.url}
          title={`Watch ${title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; presentation; display-capture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0 bg-transparent"
          onLoad={() => setIsLoading(false)}
        />

        {/* Skip Intro overlay */}
        {showSkipIntro && (
          <div className="absolute bottom-16 right-4 z-20 animate-in fade-in slide-in-from-right-4 duration-300">
            <button
              onClick={handleSkipIntro}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/75 border border-white/20 backdrop-blur-md text-white text-sm font-semibold hover:bg-black/90 hover:border-primary/60 hover:text-primary transition-all duration-200 shadow-xl group"
            >
              <SkipForward className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              Skip Intro
            </button>
          </div>
        )}
      </div>

      {/* Cast to TV Helper Modal */}
      {showCastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setShowCastModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl text-primary border border-primary/20">
                <Tv className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight text-foreground">Cast to TV</h3>
                <p className="text-xs text-muted-foreground">Stream "{title}" to your TV or Chromecast</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground pt-2">
              <div className="p-3.5 bg-secondary/40 rounded-xl border border-border/60">
                <p className="font-semibold text-foreground text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  📺 Chrome & Edge (Chromecast / Smart TV)
                </p>
                <p className="text-xs leading-relaxed">
                  Click your browser's <strong>3-dot menu</strong> (top right) &rarr; select <strong>Cast...</strong> &rarr; pick your TV device.
                </p>
              </div>

              <div className="p-3.5 bg-secondary/40 rounded-xl border border-border/60">
                <p className="font-semibold text-foreground text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  🍎 AirPlay (iPhone, iPad & Mac)
                </p>
                <p className="text-xs leading-relaxed">
                  Swipe open <strong>Control Center</strong> &rarr; tap <strong>Screen Mirroring</strong> &rarr; select your Apple TV or AirPlay TV.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button size="sm" className="font-semibold px-5" onClick={() => setShowCastModal(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
