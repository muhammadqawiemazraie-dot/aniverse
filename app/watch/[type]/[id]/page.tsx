import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Star, Clock, Calendar, Users, ChevronRight, Film } from "lucide-react"
import type { Metadata } from "next"

import { fetchCinemetaDetails, fetchSimilar } from "@/lib/cinemeta"
import type { CinemetaMeta, CinemetaVideo } from "@/lib/cinemeta"
import { VideoPlayer } from "@/components/video-player"
import { Badge } from "@/components/ui/badge"
import { ShareButton } from "@/components/share-button"
import { TrailerButton } from "@/components/trailer-modal"
import { TrackWatch } from "@/components/track-watch"
import { MediaCard } from "@/components/media-card"
import { FavoriteButton } from "@/components/favorite-button"
import { CommentsSection } from "@/components/comments-section"
import { EpisodesSidebar } from "@/components/episodes-sidebar"
import { ReviewsSection } from "@/components/reviews-section"
import { getAverageRating } from "@/app/actions/reviews"
import { WatchPartyButton } from "@/components/watch-party-button"

interface WatchPageProps {
  params: Promise<{ type: string; id: string }>
  searchParams: Promise<{ s?: string; e?: string }>
}

export async function generateMetadata({ params, searchParams }: WatchPageProps): Promise<Metadata> {
  const { type, id } = await params
  const { s, e } = await searchParams
  const season = s ? parseInt(s) : 1
  const episode = e ? parseInt(e) : 1

  try {
    const data = await fetchCinemetaDetails(type as "movie" | "series", id)
    const title =
      type === "series"
        ? `${data.name} S${season}E${episode}`
        : data.name
    const description = data.description?.slice(0, 160) ?? `Watch ${data.name} on Qverse for free.`
    const image = data.background || data.poster || "/og-banner.png"

    return {
      title,
      description,
      openGraph: {
        title: `${title} — Qverse`,
        description,
        images: [{ url: image, width: 1280, height: 720, alt: data.name }],
        type: "video.other",
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} — Qverse`,
        description,
        images: [image],
      },
    }
  } catch {
    return { title: "Watch" }
  }
}

const GENRE_COLORS: Record<string, string> = {
  Action: "from-red-600/20", Adventure: "from-orange-500/20", Comedy: "from-yellow-500/20",
  Drama: "from-blue-600/20", Horror: "from-purple-800/20", Romance: "from-pink-500/20",
  "Sci-Fi": "from-cyan-600/20", Thriller: "from-gray-700/20", Animation: "from-green-500/20",
  Anime: "from-pink-500/20", Fantasy: "from-violet-600/20", Crime: "from-slate-600/20", Mystery: "from-indigo-600/20",
  Documentary: "from-amber-600/20", Music: "from-fuchsia-500/20",
}

export default async function WatchPage(props: WatchPageProps) {
  const params = await props.params
  const searchParams = await props.searchParams

  if (params.type !== 'movie' && params.type !== 'series') notFound()

  const type = params.type as 'movie' | 'series'
  const id = params.id

  let data: CinemetaMeta | null = null
  try {
    data = await fetchCinemetaDetails(type, id)
  } catch (err) {
    console.error("fetchCinemetaDetails failed for:", type, id, err)
    notFound()
  }

  if (!data) notFound()

  const season = searchParams.s ? parseInt(searchParams.s) : 1
  const episode = searchParams.e ? parseInt(searchParams.e) : 1

  const firstGenre = data.genres?.[0]
  const [similar, userRating] = await Promise.all([
    firstGenre ? (fetchSimilar(type, firstGenre).catch(() => []) as Promise<CinemetaMeta[]>) : Promise.resolve([] as CinemetaMeta[]),
    getAverageRating(id, type).catch(() => null)
  ])
  const accentGradient = GENRE_COLORS[firstGenre ?? ""] ?? "from-primary/20"

  // Group episodes by season
  let sortedVideos: CinemetaVideo[] = []
  const seasonGroups: Record<number, CinemetaVideo[]> = {}
  if (data.videos) {
    sortedVideos = [...data.videos].sort((a, b) => {
      if (a.season !== b.season) return a.season - b.season
      return a.episode - b.episode
    })

    for (const vid of sortedVideos) {
      if (!seasonGroups[vid.season]) seasonGroups[vid.season] = []
      seasonGroups[vid.season].push(vid)
    }
  }
  const seasons = Object.keys(seasonGroups).map(Number).sort((a, b) => a - b)

  // Find Absolute Episode (used for mapping metadata to player servers)
  let absoluteEpisode: number | undefined
  if (type === "series" && sortedVideos.length > 0) {
    const regularVideos = sortedVideos.filter(v => v.season > 0)
    const idx = regularVideos.findIndex(v => v.season === season && v.episode === episode)
    if (idx !== -1) {
      absoluteEpisode = idx + 1
    }
  }

  // Find Next Episode
  let nextEp: { season: number; episode: number } | null = null
  if (type === "series" && sortedVideos.length > 0) {
    const currentIdx = sortedVideos.findIndex(v => v.season === season && v.episode === episode)
    if (currentIdx !== -1 && currentIdx < sortedVideos.length - 1) {
      nextEp = {
        season: sortedVideos[currentIdx + 1].season,
        episode: sortedVideos[currentIdx + 1].episode
      }
    }
  }

  return (
    <div className="min-h-screen">
      {/* Track history silently */}
      <TrackWatch
        id={data.id}
        type={type}
        name={data.name}
        poster={data.poster}
        season={type === 'series' ? season : undefined}
        episode={type === 'series' ? episode : undefined}
        imdbRating={data.imdbRating}
        releaseInfo={data.releaseInfo}
      />

      {/* Cinematic backdrop */}
      {data.background && (
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <Image src={data.background} alt="" fill className="object-cover opacity-[0.06]" />
          <div className="absolute inset-0 bg-background/95" />
        </div>
      )}

      <div className="container mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/genres/${encodeURIComponent(firstGenre ?? "")}?type=${type}`} className="hover:text-foreground transition-colors capitalize">{firstGenre ?? type}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium line-clamp-1">{data.name}</span>
        </div>

        {/* ── Rearranged Grid for Theater Mode ── */}
        <div className="watch-page-container">
          
          {/* 1. Player Area */}
          <div className="flex flex-col gap-3">
            <div className="watch-player-area relative rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
              <div className={`absolute inset-0 bg-gradient-to-b ${accentGradient} to-transparent pointer-events-none z-10 opacity-30`} />
              <VideoPlayer
                imdbId={data.id}
                type={type}
                season={season}
                episode={episode}
                title={data.name}
                absoluteEpisode={absoluteEpisode}
              />
            </div>
            
            {/* Next Episode Button */}
            {nextEp && (
              <div className="flex justify-end">
                <Link
                  href={`/watch/${type}/${id}?s=${nextEp.season}&e=${nextEp.episode}`}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                >
                  Next Episode: S{nextEp.season} E{nextEp.episode}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* 2. Info Area */}
          <div className="watch-info-area flex flex-col gap-6">
            {/* Info card */}
            <div className={`flex flex-col gap-5 bg-gradient-to-br ${accentGradient} to-secondary/10 p-6 rounded-2xl border border-white/8 backdrop-blur-sm`}>
              {/* Title row */}
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-0">
                  {type === "series" && (
                    <p className="text-xs text-primary font-semibold mb-1 uppercase tracking-wider">
                      Season {season} · Episode {episode}
                    </p>
                  )}
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">{data.name}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-3">
                    {data.imdbRating && (
                      <span className="flex items-center gap-1.5 bg-yellow-500/15 text-yellow-400 px-2.5 py-0.5 rounded-full border border-yellow-500/30 font-semibold" title="IMDb Rating">
                        <Star className="w-3.5 h-3.5 fill-current" /> {data.imdbRating} IMDb
                      </span>
                    )}
                    {userRating && (
                      <span className="flex items-center gap-1.5 bg-primary/15 text-primary px-2.5 py-0.5 rounded-full border border-primary/30 font-semibold" title="Qverse User Rating">
                        <Star className="w-3.5 h-3.5 fill-current" /> {userRating} User
                      </span>
                    )}
                    {data.releaseInfo && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> {data.releaseInfo}
                      </span>
                    )}
                    {data.runtime && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {data.runtime}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <TrailerButton title={data.name} year={data.releaseInfo?.split('–')[0]} />
                  <FavoriteButton 
                    mediaId={data.id} 
                    mediaType={type} 
                    title={data.name} 
                    imageUrl={data.poster} 
                  />
                  <WatchPartyButton
                    mediaId={id}
                    mediaType={type}
                    season={season}
                    episode={episode}
                  />
                  <ShareButton title={data.name} />
                </div>
              </div>

              {/* Genres */}
              {data.genres && data.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.genres.map((g: string) => (
                    <Link key={g} href={`/genres/${encodeURIComponent(g)}?type=${type}`}>
                      <Badge variant="outline" className="bg-white/5 backdrop-blur-sm hover:bg-primary/20 hover:border-primary/60 cursor-pointer transition-all text-xs font-medium">
                        {g}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}

              <p className="text-muted-foreground leading-relaxed text-sm">
                {data.description || "No overview available."}
              </p>

              {/* Cast / Director */}
              {((data.cast && data.cast.length > 0) || (data.director && data.director.length > 0)) && (
                <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-white/8">
                  {data.director && data.director.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5" /> Director
                      </h3>
                      <p className="text-sm">{data.director.join(", ")}</p>
                    </div>
                  )}
                  {data.cast && data.cast.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Cast
                      </h3>
                      <p className="text-sm">{data.cast.slice(0, 6).join(", ")}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reviews & Ratings */}
            <ReviewsSection
              mediaId={data.id}
              mediaType={type}
            />

            {/* Comments & Discussions */}
            <CommentsSection
              mediaId={data.id}
              mediaType={type}
              episodeId={type === "series" ? `${season}x${episode}` : undefined}
            />
          </div>

          {/* 3. Sidebar Area */}
          <div className="watch-sidebar-area flex flex-col gap-5">
            {type === 'series' && data.videos && data.videos.length > 0 ? (
              <EpisodesSidebar
                videos={data.videos}
                season={season}
                episode={episode}
                type={type}
                id={id}
                seasons={seasons}
                fallbackPoster={data.background || data.poster}
              />
            ) : (
              /* Movie poster sidebar */
              <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                {data.poster ? (
                  <Image src={data.poster} alt={data.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">No Poster</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {data.imdbRating && (
                  <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 text-white text-sm font-bold">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    {data.imdbRating} IMDb
                  </div>
                )}
              </div>
            )}

            {/* Awards if available */}
            {data.awards && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-sm text-yellow-200/80">
                🏆 {data.awards}
              </div>
            )}
          </div>

          {/* 4. Similar Area */}
          {similar.length > 0 && (
            <div className="watch-similar-area">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-6 rounded-full bg-primary" />
                <h2 className="text-xl font-bold">More Like This</h2>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {similar.filter((s: CinemetaMeta) => s.id !== id).slice(0, 10).map((item: CinemetaMeta) => (
                  <MediaCard
                    key={item.id}
                    id={item.id}
                    type={type}
                    name={item.name}
                    poster={item.poster}
                    releaseInfo={item.releaseInfo}
                    imdbRating={item.imdbRating}
                  />
                ))}
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  )
}
