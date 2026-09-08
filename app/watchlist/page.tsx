import Link from "next/link"
import { redirect } from "next/navigation"
import { Bookmark } from "lucide-react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/app/actions/auth"
import { getUserFavorites, getPublicFavorites } from "@/app/actions/favorites"
import { WatchlistTabs } from "@/components/watchlist-tabs"
import type { WatchlistItem } from "@/components/watchlist-tabs"

interface WatchlistPageProps {
  searchParams: Promise<{ u?: string }>
}

export default async function WatchlistPage({ searchParams }: WatchlistPageProps) {
  const params = await searchParams
  const targetUser = params.u

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let favorites = []
  let isShared = false

  if (targetUser) {
    favorites = await getPublicFavorites(targetUser)
    isShared = true
  } else {
    if (!user) {
      redirect("/login")
    }
    favorites = await getUserFavorites()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bookmark className="w-8 h-8 text-primary" />
            {isShared ? "Shared Watchlist & Library" : "My Watchlist & Library"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isShared 
              ? "Viewing a public shared library catalog on Qverse." 
              : "Manage and filter your saved movies and anime series."}
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-20 bg-secondary/20 rounded-2xl border border-white/5">
          <Bookmark className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{isShared ? "Watchlist is empty" : "Your library is empty"}</h2>
          <p className="text-muted-foreground mb-6">
            {isShared 
              ? "This user has not added any public titles yet." 
              : "Start exploring to track items in your library!"}
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/browse">
              <Button variant="outline" className="font-bold text-xs">Browse Anime</Button>
            </Link>
          </div>
        </div>
      ) : (
        <WatchlistTabs initialFavorites={favorites as WatchlistItem[]} />
      )}
    </div>
  )
}
