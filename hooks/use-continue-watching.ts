"use client"

import * as React from "react"
import { getUserProgressDB, saveProgressDB, deleteProgressDB, clearAllProgressDB } from "@/app/actions/progress"

export interface WatchedItem {
  id: string
  type: 'movie' | 'series'
  name: string
  poster?: string
  season?: number
  episode?: number
  watchedAt: number
}

const STORAGE_KEY = "qverse_continue_watching"
const LEGACY_STORAGE_KEY = "aniverse_continue_watching"
const MAX_ITEMS = 12

export function useContinueWatching() {
  const [items, setItems] = React.useState<WatchedItem[]>([])

  React.useEffect(() => {
    // Load local storage first
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)
      if (raw) {
        setTimeout(() => setItems(JSON.parse(raw)), 0)
      }
    } catch {}

    // Fetch database progress and merge
    getUserProgressDB().then(dbProgress => {
      if (!dbProgress || dbProgress.length === 0) return
      
      setItems(prev => {
        const watchItems = dbProgress
          .filter(p => p.media_type === "movie" || p.media_type === "series")
          .map(p => ({
            id: p.media_id,
            type: p.media_type as 'movie' | 'series',
            name: p.title,
            poster: p.image_url || undefined,
            season: p.season || undefined,
            episode: p.episode || undefined,
            watchedAt: new Date(p.updated_at).getTime()
          }))

        const mergedMap = new Map<string, WatchedItem>()
        watchItems.forEach(item => mergedMap.set(`${item.type}-${item.id}`, item))
        prev.forEach(item => {
          const key = `${item.type}-${item.id}`
          const existing = mergedMap.get(key)
          if (!existing || item.watchedAt > existing.watchedAt) {
            mergedMap.set(key, item)
          }
        })

        const merged = Array.from(mergedMap.values())
          .sort((a, b) => b.watchedAt - a.watchedAt)
          .slice(0, MAX_ITEMS)

        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)) } catch {}
        return merged
      })
    }).catch(err => console.error("Failed to fetch database progress:", err))
  }, [])

  const addItem = React.useCallback((item: Omit<WatchedItem, 'watchedAt'>) => {
    setItems(prev => {
      const filtered = prev.filter(i => !(i.id === item.id && i.type === item.type))
      const updated = [{ ...item, watchedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })

    // Save to Database
    saveProgressDB({
      mediaId: item.id,
      mediaType: item.type,
      title: item.name,
      imageUrl: item.poster || null,
      season: item.season,
      episode: item.episode,
    }).catch(err => console.error("Failed to sync watch progress to DB:", err))
  }, [])

  const removeItem = React.useCallback((id: string, type: string) => {
    setItems(prev => {
      const updated = prev.filter(i => !(i.id === id && i.type === type))
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })

    // Remove from Database
    deleteProgressDB(id).catch(err => console.error("Failed to delete progress from DB:", err))
  }, [])

  const clearAll = React.useCallback(() => {
    setItems([])
    try { localStorage.removeItem(STORAGE_KEY) } catch {}

    // Clear all from Database
    clearAllProgressDB().catch(err => console.error("Failed to clear watch progress from DB:", err))
  }, [])

  return { items, addItem, removeItem, clearAll }
}
