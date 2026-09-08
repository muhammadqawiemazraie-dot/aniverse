"use client"

import * as React from "react"
import { useContinueWatching } from "@/hooks/use-continue-watching"
import { useRecentlyViewed } from "@/hooks/use-recently-viewed"

interface TrackWatchProps {
  id: string
  type: 'movie' | 'series'
  name: string
  poster?: string
  season?: number
  episode?: number
  imdbRating?: string
  releaseInfo?: string
}

export function TrackWatch({ id, type, name, poster, season, episode, imdbRating, releaseInfo }: TrackWatchProps) {
  const { addItem: addContinue } = useContinueWatching()
  const { addItem: addRecent } = useRecentlyViewed()

  React.useEffect(() => {
    addContinue({ id, type, name, poster, season, episode })
    addRecent({ id, type, name, poster, imdbRating, releaseInfo })
  }, [id, type, name, poster, season, episode, imdbRating, releaseInfo, addContinue, addRecent])

  return null
}
