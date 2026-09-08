"use client"

import { Share2, Check } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Link copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 text-sm font-medium transition-all hover:scale-105"
      aria-label="Share"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Share2 className="w-4 h-4" />
      )}
      {copied ? "Copied!" : "Share"}
    </button>
  )
}
