"use client"

import * as React from "react"
import { Play, X } from "lucide-react"

interface TrailerModalProps {
  title: string
  year?: string
}

export function TrailerButton({ title, year }: TrailerModalProps) {
  const [open, setOpen] = React.useState(false)

  // Build a YouTube search query
  const searchQuery = encodeURIComponent(`${title} ${year || ""} official trailer`)
  const embedUrl = `https://www.youtube.com/embed?listType=search&list=${searchQuery}`

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 text-sm font-medium transition-all hover:scale-105"
      >
        <Play className="w-4 h-4" />
        Trailer
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="relative w-full max-w-3xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <iframe
              src={embedUrl}
              title={`${title} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </>
  )
}
