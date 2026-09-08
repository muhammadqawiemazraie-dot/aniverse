import Link from "next/link"
import { Clapperboard, Tv2, Layers } from "lucide-react"
import { ALL_GENRES } from "@/lib/cinemeta"

const GENRE_EMOJIS: Record<string, string> = {
  "Action": "💥",
  "Adventure": "🗺️",
  "Animation": "🎨",
  "Anime": "🎌",
  "Comedy": "😂",
  "Crime": "🔫",
  "Documentary": "🎬",
  "Drama": "🎭",
  "Fantasy": "🧙",
  "Horror": "👻",
  "Mystery": "🔍",
  "Romance": "❤️",
  "Sci-Fi": "🚀",
  "Thriller": "😱",
  "Western": "🤠",
  "Family": "👨‍👩‍👧",
  "History": "📜",
  "Music": "🎵",
  "Sport": "⚽",
  "War": "⚔️",
}

export default function GenresPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
          <Layers className="w-9 h-9 text-primary" />
          Browse by Genre
        </h1>
        <p className="text-muted-foreground">Discover content by your favorite genre</p>
      </div>

      {/* Movies by genre */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Clapperboard className="w-6 h-6 text-primary" /> Movies
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {ALL_GENRES.map(genre => (
            <Link
              key={`movie-${genre}`}
              href={`/genres/${encodeURIComponent(genre)}?type=movie`}
              className="group relative flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border border-border/50 bg-secondary/10 hover:bg-primary/10 hover:border-primary/50 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/10"
            >
              <span className="text-4xl">{GENRE_EMOJIS[genre] || "🎬"}</span>
              <span className="font-semibold text-sm text-center">{genre}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Series by genre */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Tv2 className="w-6 h-6 text-primary" /> TV &amp; Anime
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {ALL_GENRES.map(genre => (
            <Link
              key={`series-${genre}`}
              href={`/genres/${encodeURIComponent(genre)}?type=series`}
              className="group relative flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border border-border/50 bg-secondary/10 hover:bg-primary/10 hover:border-primary/50 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/10"
            >
              <span className="text-4xl">{GENRE_EMOJIS[genre] || "📺"}</span>
              <span className="font-semibold text-sm text-center">{genre}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
