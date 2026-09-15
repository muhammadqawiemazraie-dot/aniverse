import { NextResponse } from "next/server"
import { searchCinemeta } from "@/lib/cinemeta"
import type { CinemetaMeta } from "@/lib/cinemeta"

export interface SuggestionItem {
  id: string
  name: string
  poster: string | null
  type: "movie" | "series"
  releaseInfo: string | null
  imdbRating?: string | null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") || ""

  if (q.trim().length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const [movies, series] = await Promise.all([
      searchCinemeta("movie", q).catch(() => [] as CinemetaMeta[]),
      searchCinemeta("series", q).catch(() => [] as CinemetaMeta[]),
    ])

    const results: SuggestionItem[] = [
      ...movies.slice(0, 3).map((m) => ({
        id: m.id,
        name: m.name,
        poster: m.poster || null,
        type: "movie" as const,
        releaseInfo: m.releaseInfo || null,
        imdbRating: m.imdbRating || null,
      })),
      ...series.slice(0, 3).map((s) => ({
        id: s.id,
        name: s.name,
        poster: s.poster || null,
        type: "series" as const,
        releaseInfo: s.releaseInfo || null,
        imdbRating: s.imdbRating || null,
      })),
    ]

    return NextResponse.json(
      { results, suggestions: results },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      }
    )
  } catch (error) {
    console.error("Suggestions error:", error)
    return NextResponse.json({ results: [], suggestions: [] })
  }
}
