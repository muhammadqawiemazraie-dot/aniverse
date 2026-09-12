"use client"

import * as React from "react"
import { Download, ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface DownloadButtonProps {
  imdbId: string
  type: "movie" | "series"
  season?: number
  episode?: number
  title: string
  variant?: "default" | "secondary" | "outline" | "ghost"
  className?: string
}

export function DownloadButton({
  imdbId,
  type,
  season = 1,
  episode = 1,
  title,
  variant = "secondary",
  className = "",
}: DownloadButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const DOWNLOAD_SERVERS = [
    {
      name: "VidLink HD Downloader",
      badge: "Recommended",
      description: "Direct video stream & subtitle downloader portal",
      url:
        type === "movie"
          ? `https://vidlink.pro/download/movie/${imdbId}`
          : `https://vidlink.pro/download/tv/${imdbId}/${season}/${episode}`,
    },
    {
      name: "VidSrc Mirror Downloader",
      badge: "Mirror Server",
      description: "High-speed video server mirror",
      url:
        type === "movie"
          ? `https://vidsrc.me/embed/movie?imdb=${imdbId}`
          : `https://vidsrc.me/embed/tv?imdb=${imdbId}&season=${season}&episode=${episode}`,
    },
  ]

  return (
    <>
      <Button
        variant={variant}
        size="sm"
        className={`h-9 text-xs rounded-xl flex items-center gap-1.5 transition-all ${className}`}
        onClick={() => setIsOpen(true)}
        title="Download Video"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Download</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 text-left">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl text-primary border border-primary/20">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight text-foreground">Download Video</h3>
                <p className="text-xs text-muted-foreground">
                  Select a download server for "{title}" {type === "series" ? `(S${season} E${episode})` : ""}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {DOWNLOAD_SERVERS.map((server, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-secondary/40 rounded-xl border border-border/60 flex items-center justify-between gap-3 hover:border-primary/40 transition-all"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-foreground text-xs truncate">{server.name}</span>
                      <span className="text-[10px] bg-primary/15 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/30 flex-shrink-0">
                        {server.badge}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{server.description}</p>
                  </div>
                  <a
                    href={server.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      toast.success(`Opening ${server.name}...`)
                      setIsOpen(false)
                    }}
                    className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold px-3 py-2 rounded-lg shadow transition-all flex-shrink-0"
                  >
                    Download
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>

            <div className="p-3 bg-muted/40 rounded-xl border border-white/5 text-[11px] text-muted-foreground space-y-1">
              <p className="font-bold text-foreground">💡 Fast Download Tip:</p>
              <p>For high-speed multi-threaded downloads with subtitle tracks, use <strong>IDM (Internet Download Manager)</strong> or <strong>1DM app</strong> on Android.</p>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
