import { NextResponse } from "next/server"
import { fetchTrendingMovies, fetchTrendingSeries } from "@/lib/cinemeta"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") as "movie" | "series" | null
  const skip = parseInt(searchParams.get("skip") || "0", 10)

  if (type !== "movie" && type !== "series") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }

  try {
    const data = type === "movie"
      ? await fetchTrendingMovies(skip)
      : await fetchTrendingSeries(skip)

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}
