import type { Metadata } from "next"
import Link from "next/link"
import { AlignLeft, Film, Tv, Sparkles, Search, X } from "lucide-react"

import { MediaCard } from "@/components/media-card"
import { CountryFilterDropdown } from "@/components/country-filter"
import {
  searchCinemeta,
  fetchTrendingMovies,
  fetchTrendingSeries,
  fetchCinemetaDetails,
  fetchByGenre,
} from "@/lib/cinemeta"
import type { CinemetaMeta } from "@/lib/cinemeta"

interface BrowseItem {
  id: string
  name: string
  poster?: string | null
  releaseInfo?: string | null
  imdbRating?: string | null
  genres?: string[]
  type: string
}

const LETTERS = ["ALL", "#", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

const COUNTRY_SEARCH_MAP: Record<string, string> = {
  JP: "anime",
  KR: "korean",
  CN: "chinese",
  IN: "indian",
  ES: "spanish",
  FR: "french",
  DE: "german",
  IT: "italian",
  TH: "thai",
  TR: "turkish",
  MX: "mexican",
  BR: "brazilian",
  ID: "indonesian",
  MY: "malaysian",
  PH: "filipino",
  RU: "russian",
  SE: "swedish",
  NO: "norwegian",
  DK: "danish",
  NL: "dutch",
  PL: "polish",
  IE: "irish",
  GB: "british",
  US: "american",
  CA: "canadian",
  AU: "australian",
  EG: "egyptian",
  AR: "argentine",
  CL: "chilean",
  CO: "colombian"
}

interface BrowsePageProps {
  searchParams: Promise<{
    q?: string
    letter?: string
    type?: string
    sort?: string
    minRating?: string
    minYear?: string
    country?: string
    page?: string
  }>
}

export async function generateMetadata({
  searchParams,
}: BrowsePageProps): Promise<Metadata> {
  const { q, letter = "ALL" } = await searchParams
  if (q) {
    return {
      title: `Search: "${q}"`,
      description: `Search results for "${q}" — find movies, TV series, and anime on Qverse.`,
    }
  }
  return {
    title: letter !== "ALL" ? `Browse: Letter "${letter}"` : "A–Z Browse Catalog",
    description: "Browse all movies, TV series, and anime alphabetically on Qverse.",
  }
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const {
    q,
    letter = "ALL",
    type = "all",
    sort = "default",
    minRating,
    minYear,
    country = "",
    page = "1"
  } = await searchParams

  const query = q || ""
  const countryQuery = !query && country ? COUNTRY_SEARCH_MAP[country] || "" : ""
  const effectiveQuery = query || countryQuery

  const activeLetter = letter.toUpperCase()
  const currentPage = Math.max(1, parseInt(page) || 1)
  const skip = (currentPage - 1) * 48

  let results: BrowseItem[] = []
  let hasNextPage = false

  try {
    if (effectiveQuery) {
      // 1. Text or Country Search Mode
      const fetchMovies = type === "all" || type === "movie"
      const fetchSeries = type === "all" || type === "series" || type === "anime"

      const fetches = await Promise.allSettled([
        fetchMovies ? searchCinemeta("movie", effectiveQuery) : Promise.resolve([]),
        fetchSeries ? (country === "JP" || type === "anime" ? fetchByGenre("series", "Animation", skip) : searchCinemeta("series", effectiveQuery)) : Promise.resolve([]),
      ])

      const movieResults: BrowseItem[] = fetches[0].status === "fulfilled" ? (fetches[0].value as CinemetaMeta[]).map((m) => ({
        id: m.id,
        name: m.name,
        poster: m.poster,
        releaseInfo: m.releaseInfo,
        imdbRating: m.imdbRating,
        genres: m.genres,
        type: m.type || "movie",
      })) : []
      const seriesResults: BrowseItem[] = fetches[1].status === "fulfilled" ? (fetches[1].value as CinemetaMeta[]).map((s) => ({
        id: s.id,
        name: s.name,
        poster: s.poster,
        releaseInfo: s.releaseInfo,
        imdbRating: s.imdbRating,
        genres: s.genres,
        type: s.type || "series",
      })) : []

      results = [...movieResults, ...seriesResults]
    } else {
      // 2. A-Z / Trending Browse Mode
      const fetchMovies = type === "all" || type === "movie"
      const fetchSeries = type === "all" || type === "series" || type === "anime"

      const fetchedResults = await Promise.all([
        fetchMovies ? (activeLetter === "ALL" ? fetchTrendingMovies(skip) : searchCinemeta("movie", activeLetter === "#" ? "0" : activeLetter)) : Promise.resolve([]),
        fetchSeries ? (activeLetter === "ALL" ? (type === "anime" ? fetchByGenre("series", "Animation", skip) : fetchTrendingSeries(skip)) : searchCinemeta("series", activeLetter === "#" ? "0" : activeLetter)) : Promise.resolve([]),
      ])

      const movieResults: BrowseItem[] = fetchedResults[0].map((m) => ({
        id: m.id,
        name: m.name,
        poster: m.poster,
        releaseInfo: m.releaseInfo,
        imdbRating: m.imdbRating,
        genres: m.genres,
        type: m.type || "movie",
      }))
      const seriesResults: BrowseItem[] = fetchedResults[1].map((s) => ({
        id: s.id,
        name: s.name,
        poster: s.poster,
        releaseInfo: s.releaseInfo,
        imdbRating: s.imdbRating,
        genres: s.genres,
        type: s.type || "series",
      }))

      results = [...movieResults, ...seriesResults]
    }

    // Resolve genres if needed for filtering/anime/country type checks
    const needsGenres = type === "anime" || minRating || minYear
    if (needsGenres && results.length > 0) {
      results = await Promise.all(
        results.map(async (item) => {
          if (item.genres) return item // Already resolved
          try {
            const details = await fetchCinemetaDetails(item.type as "movie" | "series", item.id)
            return { ...item, genres: details.genres || [] }
          } catch {
            return { ...item, genres: [] }
          }
        })
      )
    }

    // Deduplicate by ID
    const uniqueMap = new Map()
    for (const item of results) {
      if (item && item.id) {
        uniqueMap.set(item.id, item)
      }
    }
    const deduplicated = Array.from(uniqueMap.values())
    hasNextPage = deduplicated.length >= 48

    // Filter results
    results = deduplicated.filter((item) => {
      // 1. Media Type specific checks
      if (item.type === "series" || item.type === "movie") {
        const isAnimation = item.genres?.includes("Animation") || item.genres?.includes("Anime")
        if (type === "anime" && !isAnimation) return false
        if (type === "series" && isAnimation) return false
      }

      // 2. Alphabet filter
      if (activeLetter !== "ALL") {
        const first = item.name?.[0]?.toUpperCase() ?? ""
        const matchesLetter = activeLetter === "#" ? /^[0-9]/.test(item.name ?? "") : first === activeLetter
        if (!matchesLetter) return false
      }

      // 3. Rating filter
      if (minRating) {
        const rating = parseFloat(item.imdbRating || "0")
        if (rating < parseFloat(minRating)) return false
      }

      // 4. Year filter
      if (minYear) {
        const year = parseInt(item.releaseInfo?.slice(0, 4) || "0")
        if (year < parseInt(minYear)) return false
      }

      return true
    })

    // Sorting
    const activeSort = sort === "default" && effectiveQuery ? "relevance" : sort
    if (activeSort === "rating") {
      results.sort((a, b) => parseFloat(b.imdbRating || "0") - parseFloat(a.imdbRating || "0"))
    } else if (activeSort === "year") {
      results.sort((a, b) => {
        const ya = parseInt(a.releaseInfo?.slice(0, 4) || "0")
        const yb = parseInt(b.releaseInfo?.slice(0, 4) || "0")
        return yb - ya
      })
    } else if (activeSort === "name") {
      results.sort((a, b) => a.name.localeCompare(b.name))
    }
  } catch (error) {
    console.error("Browse loading error:", error)
  }

  const buildUrl = (params: Record<string, string | undefined>) => {
    const urlParams = new URLSearchParams()
    if (query) urlParams.set("q", query)
    if (activeLetter !== "ALL") urlParams.set("letter", activeLetter)
    if (type !== "all") urlParams.set("type", type)
    if (sort !== "default") urlParams.set("sort", sort)
    if (minYear) urlParams.set("minYear", minYear)
    if (minRating) urlParams.set("minRating", minRating)
    if (country) urlParams.set("country", country)

    Object.entries(params).forEach(([k, v]) => {
      if (v) urlParams.set(k, v)
      else urlParams.delete(k)
    })

    return `/browse?${urlParams.toString()}`
  }

  return (
    <div className="container mx-auto px-4 py-10 min-h-[75vh] flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary/20 border border-primary/30">
            <AlignLeft className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              {query ? (
                <>Results for <span className="text-primary">&quot;{query}&quot;</span></>
              ) : country ? (
                <>Content from <span className="text-primary">{country}</span></>
              ) : activeLetter !== "ALL" ? (
                <>Letter <span className="text-primary">&quot;{activeLetter}&quot;</span></>
              ) : (
                "Catalog Explorer"
              )}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {effectiveQuery
                ? `Found ${results.length} titles matching your filter`
                : `Browse and search the entire Qverse catalogue`}
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <form action="/browse" method="GET" className="w-full max-w-2xl relative mb-2">
        {type !== "all" && <input type="hidden" name="type" value={type} />}
        {sort !== "default" && <input type="hidden" name="sort" value={sort} />}
        {minYear && <input type="hidden" name="minYear" value={minYear} />}
        {minRating && <input type="hidden" name="minRating" value={minRating} />}
        {country && <input type="hidden" name="country" value={country} />}
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search movies, TV shows, anime..."
            className="w-full pl-12 pr-12 py-3 bg-secondary/20 border border-white/5 hover:border-white/10 focus:border-primary/50 focus:bg-secondary/40 rounded-2xl text-white placeholder:text-muted-foreground focus:outline-none transition-all text-sm shadow-md"
          />
          {query && (
            <Link
              href={buildUrl({ q: undefined })}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </Link>
          )}
        </div>
      </form>

      {/* Quick Preset Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 -mt-1 mb-1">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Quick Filters:</span>
        {[
          { label: "🔥 Trending", params: { country: undefined, minRating: undefined, minYear: undefined } },
          { label: "⭐ 8.0+ Top Rated", params: { minRating: "8" } },
          { label: "🎌 Japanese Anime", params: { country: "JP", type: "anime" } },
          { label: "🇰🇷 K-Drama", params: { country: "KR", type: "series" } },
          { label: "🍿 2020+ Releases", params: { minYear: "2020" } },
        ].map(chip => (
          <Link
            key={chip.label}
            href={buildUrl(chip.params)}
            className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 hover:bg-primary/20 hover:border-primary/40 hover:text-white transition-all shadow-sm"
          >
            {chip.label}
          </Link>
        ))}
      </div>

      {/* Media Type Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "All Media", value: "all", icon: AlignLeft },
          { label: "Movies", value: "movie", icon: Film },
          { label: "TV Shows", value: "series", icon: Tv },
          { label: "Anime & Cartoon", value: "anime", icon: Sparkles },
        ].map(tab => {
          const Icon = tab.icon
          const isActive = type === tab.value
          const targetUrl = buildUrl({ type: tab.value })
          return (
            <Link
              key={tab.value}
              href={targetUrl}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold border transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-secondary/30 border-border/50 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Alphabet Strip */}
      <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-secondary/10 border border-white/5">
        {LETTERS.map(l => {
          const isActive = activeLetter === l
          const targetUrl = buildUrl({ letter: l, q: undefined })
          return (
            <Link
              key={l}
              href={targetUrl}
              className={`min-w-[36px] h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all duration-200 border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30 scale-105"
                  : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/10 text-muted-foreground hover:text-foreground"
              }`}
            >
              {l}
            </Link>
          )
        })}
      </div>

      {/* Sorting & Filter Controls Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 pb-4 border-b border-white/5">
        <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
          {results.length > 0 ? (
            <>Showing <span className="text-foreground font-semibold">{results.length}</span> title{results.length !== 1 ? "s" : ""}</>
          ) : (
            "No results found"
          )}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs w-full md:w-auto">
          {/* Country Dropdown Filter (Right beside Year) */}
          <CountryFilterDropdown currentCountry={country} />

          {/* Year Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-full border border-white/5 bg-secondary/20">
            <span className="pl-3 text-muted-foreground font-semibold">Year</span>
            {[
              { label: "Any", value: "" },
              { label: "2020+", value: "2020" },
              { label: "2010+", value: "2010" },
            ].map(opt => {
              const targetUrl = buildUrl({ minYear: opt.value })
              return (
                <Link key={opt.label}
                  href={targetUrl}
                  className={`px-3 py-1.5 rounded-full font-medium transition-all ${
                    (minYear || "") === opt.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}>
                  {opt.label}
                </Link>
              )
            })}
          </div>

          {/* Rating Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-full border border-white/5 bg-secondary/20">
            <span className="pl-3 text-muted-foreground font-semibold">Rating</span>
            {[
              { label: "Any", value: "" },
              { label: "8.0+", value: "8" },
              { label: "7.0+", value: "7" },
            ].map(opt => {
              const targetUrl = buildUrl({ minRating: opt.value })
              return (
                <Link key={opt.label}
                  href={targetUrl}
                  className={`px-3 py-1.5 rounded-full font-medium transition-all ${
                    (minRating || "") === opt.value
                      ? "bg-yellow-500 text-black shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}>
                  {opt.label}
                </Link>
              )
            })}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-1.5 p-1 rounded-full border border-white/5 bg-secondary/20">
            <span className="pl-3 text-muted-foreground font-semibold">Sort</span>
            {[
              { label: "Default", value: "default" },
              { label: "Rating", value: "rating" },
              { label: "Newest", value: "year" },
            ].map(opt => {
              const targetUrl = buildUrl({ sort: opt.value })
              return (
                <Link key={opt.value}
                  href={targetUrl}
                  className={`px-3 py-1.5 rounded-full font-medium transition-all ${
                    sort === opt.value
                      ? "bg-white text-black shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}>
                  {opt.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {results.length === 0 ? (
        <div className="text-center py-24 flex flex-col items-center gap-4 bg-secondary/5 border border-white/5 rounded-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="text-6xl font-black text-muted-foreground/10 select-none uppercase">{query ? "Search" : country || activeLetter}</div>
          <p className="text-muted-foreground">
            No {type === "movie" ? "movies" : type === "series" ? "series" : type === "anime" ? "anime" : "titles"} found.
          </p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Try selecting &quot;All Countries&quot; or clearing search keywords.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {results.map(item => {
            const itemType = item.type === "series" ? "series" : "movie"
            return (
              <MediaCard
                key={`${item.type}-${item.id}`}
                id={item.id}
                type={itemType}
                name={item.name}
                poster={item.poster}
                releaseInfo={item.releaseInfo}
                imdbRating={item.imdbRating}
                showType={type === "all"}
              />
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {!query && activeLetter === "ALL" && (results.length > 0 || currentPage > 1) && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 pb-6 pt-6">
          <Link
            href={buildUrl({ page: (currentPage - 1).toString() })}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              currentPage === 1
                ? "pointer-events-none opacity-40 bg-secondary/20 border-border/30 text-muted-foreground"
                : "bg-secondary/30 border-border/50 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            ← Previous
          </Link>
          
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((p) => (
              <Link
                key={p}
                href={buildUrl({ page: p.toString() })}
                className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all border ${
                  currentPage === p
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-secondary/30 border-border/50 hover:bg-primary/10 hover:border-primary/30 hover:text-foreground text-muted-foreground"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>

          <Link
            href={buildUrl({ page: (currentPage + 1).toString() })}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              !hasNextPage
                ? "pointer-events-none opacity-40 bg-secondary/20 border-border/30 text-muted-foreground"
                : "bg-secondary/30 border-border/50 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            Next →
          </Link>
        </div>
      )}
    </div>
  )
}
