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

export function isAnimeTitle(meta: Partial<CinemetaMeta>): boolean {
  if (!meta) return false
  if (meta.genres?.includes("Anime")) return true
  const isAnimated = meta.genres?.includes("Animation")
  if (!isAnimated) return false

  const text = `${meta.name || ""} ${meta.description || ""} ${meta.awards || ""}`.toLowerCase()

  const animeKeywords = [
    "anime", "manga", "japanese", "japan", "ova", "jikan", "myanimelist", "mal",
    "shounen", "shonen", "seinen", "shoujo", "isekai", "mecha", "tokyo",
    "bleach", "naruto", "one piece", "titan", "kaisen", "slayer", "dragon ball",
    "ghoul", "alchemist", "hunter x hunter", "frieren", "solo leveling", "evangelion",
    "gundam", "jojo", "ghibli", "boruto", "pokemon", "digimon", "yugioh", "berserk",
    "clover", "dr. stone", "fire force", "slam dunk", "conan", "inuyasha", "punch man",
    "mob psycho", "re:zero", "overlord", "konosuba", "fate/", "hero academia", "death note",
    "chainsaw man", "sword art", "spy x family", "steins;gate", "vinland", "haikyu",
    "code geass", "fairy tail", "cowboy bebop", "sailor moon", "blue lock", "subbed", "dubbed"
  ]

  if (animeKeywords.some(kw => text.includes(kw))) return true

  const westernKeywords = ["simpsons", "family guy", "spongebob", "south park", "looney tunes", "pixar", "disney", "dreamworks", "nickelodeon", "rick and morty", "futurama", "avatar: the last airbender"]
  const isWestern = westernKeywords.some(kw => text.includes(kw))
  if (!isWestern && (meta.type === "series" || meta.type === "anime")) {
    return true
  }

  return false
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

  let genres = meta.genres ? [...meta.genres] : []
  if (isAnimeTitle(meta) && !genres.includes("Anime")) {
    genres.push("Anime")
  }

  return {
    ...meta,
    genres: genres.length > 0 ? genres : meta.genres,
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
  const queryGenre = genre === "Anime" ? "Animation" : genre
  const url = skip
    ? `${CINEMETA_API_URL}/catalog/${type}/top/genre=${encodeURIComponent(queryGenre)}&skip=${skip}.json`
    : `${CINEMETA_API_URL}/catalog/${type}/top/genre=${encodeURIComponent(queryGenre)}.json`
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
    const queryGenre = genre === "Anime" ? "Animation" : genre
    const res = await fetch(`${CINEMETA_API_URL}/catalog/${type}/top/genre=${encodeURIComponent(queryGenre)}.json`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return sanitizeMetas((data.metas as CinemetaMeta[]).slice(0, 12))
  } catch {
    return []
  }
}

export const ALL_GENRES = [
  "Action", "Adventure", "Animation", "Anime", "Comedy", "Crime",
  "Documentary", "Drama", "Fantasy", "Horror", "Mystery",
  "Romance", "Sci-Fi", "Thriller", "Western", "Family",
  "History", "Music", "Sport", "War"
]
