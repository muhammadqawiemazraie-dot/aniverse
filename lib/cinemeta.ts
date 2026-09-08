const CINEMETA_API_URL = "https://v3-cinemeta.strem.io"

export interface CinemetaMeta {
  id: string
  type: string
  name: string
  genres?: string[]
  poster?: string
  background?: string
  logo?: string
  description?: string
  releaseInfo?: string
  imdbRating?: string
  runtime?: string
  cast?: string[]
  director?: string[]
  videos?: CinemetaVideo[]
  year?: number
  trailers?: { source: string; type: string }[]
  awards?: string
}

export interface CinemetaVideo {
  id: string
  title: string
  released: string
  season: number
  episode: number
  overview?: string
  thumbnail?: string
  name?: string
}

function sanitizeMeta(meta: CinemetaMeta): CinemetaMeta {
  if (!meta) return meta
  let poster = meta.poster
  if (poster && typeof poster === "string") {
    // Strip trailing .jpg if added to Metahub space URLs
    if (poster.includes("images.metahub.space") && poster.endsWith(".jpg")) {
      poster = poster.replace(/\.jpg$/, "")
    }
  } else if (!poster && meta.id && meta.id.startsWith("tt")) {
    poster = `https://images.metahub.space/poster/small/${meta.id}/img`
  }

  return {
    ...meta,
    poster: poster || undefined
  }
}

function sanitizeMetas(metas: CinemetaMeta[]): CinemetaMeta[] {
  if (!Array.isArray(metas)) return []
  return metas.map(sanitizeMeta)
}

export async function fetchTrendingMovies(skip?: number) {
  const url = skip
    ? `${CINEMETA_API_URL}/catalog/movie/top/skip=${skip}.json`
    : `${CINEMETA_API_URL}/catalog/movie/top.json`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error("Failed to fetch trending movies")
  const data = await res.json()
  return sanitizeMetas(data.metas as CinemetaMeta[])
}

export async function fetchTrendingSeries(skip?: number) {
  const url = skip
    ? `${CINEMETA_API_URL}/catalog/series/top/skip=${skip}.json`
    : `${CINEMETA_API_URL}/catalog/series/top.json`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error("Failed to fetch trending series")
  const data = await res.json()
  return sanitizeMetas(data.metas as CinemetaMeta[])
}

export async function fetchByGenre(type: 'movie' | 'series', genre: string, skip?: number) {
  const url = skip
    ? `${CINEMETA_API_URL}/catalog/${type}/top/genre=${encodeURIComponent(genre)}&skip=${skip}.json`
    : `${CINEMETA_API_URL}/catalog/${type}/top/genre=${encodeURIComponent(genre)}.json`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Failed to fetch ${type} by genre`)
  const data = await res.json()
  return sanitizeMetas(data.metas as CinemetaMeta[])
}

export async function searchCinemeta(type: 'movie' | 'series', query: string) {
  const res = await fetch(`${CINEMETA_API_URL}/catalog/${type}/top/search=${encodeURIComponent(query)}.json`, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error("Failed to search")
  const data = await res.json()
  return sanitizeMetas(data.metas as CinemetaMeta[])
}

export async function fetchCinemetaDetails(type: 'movie' | 'series', id: string) {
  const res = await fetch(`${CINEMETA_API_URL}/meta/${type}/${id}.json`, { next: { revalidate: 60 } })
  if (!res.ok) {
    try {
      const retryRes = await fetch(`${CINEMETA_API_URL}/meta/${type}/${id}.json`, { cache: 'no-store' })
      if (retryRes.ok) {
        const data = await retryRes.json()
        return sanitizeMeta(data.meta as CinemetaMeta)
      }
    } catch (e) {
      console.error("Retry fetch failed:", e)
    }
    throw new Error(`Failed to fetch details: ${res.status}`)
  }
  const data = await res.json()
  return sanitizeMeta(data.meta as CinemetaMeta)
}

export async function fetchSimilar(type: 'movie' | 'series', genre: string) {
  try {
    const res = await fetch(`${CINEMETA_API_URL}/catalog/${type}/top/genre=${encodeURIComponent(genre)}.json`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return sanitizeMetas((data.metas as CinemetaMeta[]).slice(0, 12))
  } catch {
    return []
  }
}

export const ALL_GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime",
  "Documentary", "Drama", "Fantasy", "Horror", "Mystery",
  "Romance", "Sci-Fi", "Thriller", "Western", "Family",
  "History", "Music", "Sport", "War"
]
