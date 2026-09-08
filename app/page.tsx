import Link from "next/link"
import { Suspense } from "react"

import { fetchTrendingMovies, fetchTrendingSeries } from "@/lib/cinemeta"
import { Top10Row } from "@/components/top10-row"
import { ContinueWatchingRow } from "@/components/continue-watching"
import { RecentlyViewedRow } from "@/components/recently-viewed"
import { SkeletonRow } from "@/components/skeleton-card"
import { HeroCarousel } from "@/components/hero-carousel"
import { LoadMoreGrid } from "@/components/load-more-grid"

export default async function Home() {
  const [trendingMoviesData, trendingSeriesData] = await Promise.allSettled([
    fetchTrendingMovies(),
    fetchTrendingSeries(),
  ])

  const trendingMovies = trendingMoviesData.status === "fulfilled" ? (trendingMoviesData.value || []) : []
  const trendingSeries = trendingSeriesData.status === "fulfilled" ? (trendingSeriesData.value || []) : []

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Carousel */}
      <HeroCarousel movies={trendingMovies.slice(0, 8)} />

      {/* Continue Watching */}
      <ContinueWatchingRow />

      {/* Top 10 Rows */}
      {trendingMovies.length > 0 && (
        <Top10Row items={trendingMovies} type="movie" label="Top 10 Movies This Week" />
      )}
      {trendingSeries.length > 0 && (
        <Top10Row items={trendingSeries} type="series" label="Top 10 TV & Anime This Week" />
      )}

      {/* Trending Movies Grid */}
      <section id="movies" className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title text-2xl font-bold tracking-tight">Trending Movies</h2>
          <Link href="/genres?type=movie" className="text-sm text-primary hover:underline font-medium">
            View All →
          </Link>
        </div>
        <Suspense fallback={<SkeletonRow count={10} />}>
          <LoadMoreGrid initialItems={trendingMovies} type="movie" />
        </Suspense>
      </section>

      {/* Trending Series Grid */}
      <section id="series" className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title text-2xl font-bold tracking-tight">Trending TV & Anime</h2>
          <Link href="/genres?type=series" className="text-sm text-primary hover:underline font-medium">
            View All →
          </Link>
        </div>
        <Suspense fallback={<SkeletonRow count={10} />}>
          <LoadMoreGrid initialItems={trendingSeries} type="series" />
        </Suspense>
      </section>

      {/* Recently Viewed */}
      <RecentlyViewedRow />
    </div>
  )
}
