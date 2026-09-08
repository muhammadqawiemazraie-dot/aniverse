import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")
  const type = searchParams.get("type")
  const genre = searchParams.get("genre")
  const year = searchParams.get("year")
  const rating = searchParams.get("rating")
  const sort = searchParams.get("sort")

  const redirectParams = new URLSearchParams()
  if (q) redirectParams.set("q", q)
  if (type) redirectParams.set("type", type)
  if (genre) redirectParams.set("genre", genre)
  if (year) redirectParams.set("year", year)
  if (rating) redirectParams.set("minRating", rating)
  if (sort && sort !== "relevance") redirectParams.set("sort", sort)

  return NextResponse.redirect(new URL(`/browse?${redirectParams.toString()}`, request.url))
}
