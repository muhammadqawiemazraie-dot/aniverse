"use client"

import * as React from "react"
import { Download, ExternalLink, X, Copy, Check, ShieldAlert } from "lucide-react"
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
  const [copied, setCopied] = React.useState(false)

  const DOWNLOAD_SERVERS = [
    {
      name: "VidLink HD Downloader",
      badge: "Primary Server",
      description: "Direct HD video stream & subtitle download portal",
      url:
        type === "movie"
          ? `https://vidlink.pro/download/movie/${imdbId}`
          : `https://vidlink.pro/download/tv/${imdbId}/${season}/${episode}`,
    },
    {
      name: "AutoEmbed Mirror Server",
      badge: "Mirror 1",
      description: "AutoEmbed multi-quality video downloader",
      url:
        type === "movie"
          ? `https://autoembed.co/movie/imdb/${imdbId}`
          : `https://autoembed.co/tv/imdb/${imdbId}-${season}-${episode}`,
    },
    {
      name: "VidSrc Direct Player & Downloader",
      badge: "Mirror 2",
      description: "VidSrc direct video player with stream downloader",
      url:
        type === "movie"
          ? `https://vidsrc.to/embed/movie/${imdbId}`
          : `https://vidsrc.to/embed/tv/${imdbId}/${season}/${episode}`,
    },
  ]

  const pageUrl = typeof window !== "undefined" ? window.location.href : ""

  const handleCopyLink = () => {
    if (pageUrl) {
      navigator.clipboard.writeText(pageUrl)
      setCopied(true)
      toast.success("Watch page link copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

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
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
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

            {/* Brave / AdBlock Warning */}
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/25 rounded-xl flex items-start gap-2.5 text-xs text-yellow-500">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="leading-snug">
                <strong>Brave / AdBlock Users:</strong> If popups are blocked, allow popups for this site or pause Shields to open download mirrors.
              </p>
            </div>

            <div className="space-y-3 pt-1">
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
                    }}
                    className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold px-3.5 py-2 rounded-lg shadow transition-all flex-shrink-0"
                  >
                    Open Link
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>

            {/* Copy Link for IDM / 1DM */}
            <div className="p-3 bg-secondary/30 rounded-xl border border-border/50 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-foreground">Copy Video Page Link</p>
                <p className="text-[11px] text-muted-foreground">Paste into 1DM app (Android) or Web Video Caster</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs font-semibold flex-shrink-0 flex items-center gap-1.5"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy Link"}
              </Button>
            </div>

            <div className="p-3 bg-muted/40 rounded-xl border border-white/5 text-[11px] text-muted-foreground space-y-1">
              <p className="font-bold text-foreground">💡 Best Download Apps:</p>
              <p>• <strong>Android:</strong> Use <strong>1DM App</strong> or <strong>Web Video Caster</strong> (automatically grabs 1080p stream).</p>
              <p>• <strong>PC / Laptop:</strong> Use <strong>IDM (Internet Download Manager)</strong> or <strong>Video DownloadHelper</strong> extension.</p>
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
