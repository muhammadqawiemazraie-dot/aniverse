"use client"

import * as React from "react"
import { Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface WatchPartyButtonProps {
  mediaId: string
  mediaType: "movie" | "series"
  season?: number
  episode?: number
}

export function WatchPartyButton({ mediaId, mediaType, season = 1, episode = 1 }: WatchPartyButtonProps) {
  const router = useRouter()

  const startParty = () => {
    const roomId = Math.random().toString(36).substring(2, 15)
    router.push(`/watch-party/${roomId}?id=${mediaId}&type=${mediaType}&s=${season}&e=${episode}&host=true`)
  }

  return (
    <Button
      size="icon"
      variant="outline"
      onClick={startParty}
      className="rounded-full bg-secondary/80 border-white/10 hover:bg-primary/20 hover:border-primary/50 text-white hover:text-primary transition-all h-9 w-9"
      title="Start Watch Party"
    >
      <Users className="h-4.5 w-4.5" />
    </Button>
  )
}
