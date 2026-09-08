"use client"

import * as React from "react"

export interface RecentItem {
  id: string
  type: 'movie' | 'series'
  name: string
  poster?: string
  imdbRating?: string
  releaseInfo?: string
  viewedAt: number
}

const STORAGE_KEY = "aniverse_recently_viewed"
const MAX_ITEMS = 20

export function useRecentlyViewed() {
  const [items, setItems] = React.useState<RecentItem[]>([])

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        setTimeout(() => setItems(JSON.parse(raw)), 0)
      }
    } catch {}
  }, [])

  const addItem = React.useCallback((item: Omit<RecentItem, 'viewedAt'>) => {
    setItems(prev => {
      const filtered = prev.filter(i => !(i.id === item.id && i.type === item.type))
      const updated = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }, [])

  return { items, addItem }
}
