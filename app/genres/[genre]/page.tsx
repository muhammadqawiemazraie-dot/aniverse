import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Play, Star, ArrowLeft } from "lucide-react"

import { fetchByGenre } from "@/lib/cinemeta"
import type { CinemetaMeta } from "@/lib/cinemeta"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface GenrePageProps {
  params: Promise<{ genre: string }>
  searchParams: Promise<{ type?: string }>
}

export default async function GenrePage({ params, searchParams }: GenrePageProps) {
  const { genre } = await params
  const { type } = await searchParams
  const mediaType = (type === 'series' ? 'series' : 'movie') as 'movie' | 'series'
  const decodedGenre = decodeURIComponent(genre)

  let items: CinemetaMeta[] = []
  try {
    items = await fetchByGenre(mediaType, decodedGenre)
  } catch {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/genres">
            <ArrowLeft className="w-4 h-4 mr-2" />
            All Genres
          </Link>
        </Button>
        <h1 className="text-4xl font-bold">{decodedGenre}</h1>
        <p className="text-muted-foreground mt-1 capitalize">{mediaType === 'movie' ? 'Movies' : 'TV Series & Anime'}</p>
      </div>

      {/* Toggle type */}
      <div className="flex gap-2 mb-8">
        <Link href={`/genres/${genre}?type=movie`}>
          <Badge variant={mediaType === 'movie' ? 'default' : 'outline'} className="cursor-pointer text-sm py-1 px-4">
            Movies
          </Badge>
        </Link>
        <Link href={`/genres/${genre}?type=series`}>
          <Badge variant={mediaType === 'series' ? 'default' : 'outline'} className="cursor-pointer text-sm py-1 px-4">
            TV & Anime
          </Badge>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {items.map((item: CinemetaMeta) => (
          <Link href={`/watch/${mediaType}/${item.id}`} key={item.id} className="group flex flex-col gap-3">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-secondary/20">
              {item.poster && (
                <Image
                  src={item.poster}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 17vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <Play className="w-9 h-9 text-white fill-current" />
              </div>
              {item.imdbRating && (
                <Badge className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border-none text-white font-semibold text-[10px]">
                  <Star className="w-3 h-3 text-yellow-400 mr-1 fill-current" />
                  {item.imdbRating}
                </Badge>
              )}
            </div>
            <div>
              <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors text-sm">
                {item.name}
              </h3>
              <p className="text-xs text-muted-foreground">{item.releaseInfo || 'TBA'}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
