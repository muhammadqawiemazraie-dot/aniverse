import Image from "next/image"
import Link from "next/link"
import { Settings, Clock, Bookmark, Tv, Play, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/app/actions/auth"
import { getUserFavorites } from "@/app/actions/favorites"
import { getUserProgressDB } from "@/app/actions/progress"
import { SignOutButton } from "@/components/sign-out-button"
import { ThemeCustomizer } from "@/components/theme-customizer"
import { getProfiles, getActiveProfile } from "@/app/actions/profiles"
import { ProfileSwitcher } from "@/components/profile-switcher"
import { ProfileSettingsClient } from "@/components/profile-settings-client"
import { ProfileHeaderClient } from "@/components/profile-header-client"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-secondary/20 p-10 rounded-3xl border border-white/5 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/10 pointer-events-none" />
          <Tv className="w-16 h-16 text-primary mx-auto mb-6 relative z-10" />
          <h1 className="text-3xl font-black mb-3 relative z-10 tracking-tight">Join Qverse</h1>
          <p className="text-muted-foreground mb-8 relative z-10 leading-relaxed">
            Create an account to track your watching progress, save your favorites, and sync across all your devices.
          </p>
          <div className="flex flex-col gap-3 relative z-10">
            <Link href="/login" className="w-full">
              <Button size="lg" className="w-full font-bold text-md h-12">
                Sign In / Sign Up
              </Button>
            </Link>
            <Link href="/" className="w-full">
              <Button variant="ghost" className="w-full text-muted-foreground hover:text-white">
                Continue Browsing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Retrieve profiles and active profile
  const profiles = await getProfiles()
  const activeProfile = await getActiveProfile()
  const emailName = user.email?.split("@")[0] || "User"

  const activeName = activeProfile?.name || emailName
  const activeAvatar = activeProfile?.avatar_url || user.user_metadata?.avatar_url || "/avatars/1.jpg"
  const activeBanner = activeProfile?.banner_url || "https://cdn.myanimelist.net/images/anime/1015/138006l.jpg"

  // User is logged in — data is automatically profile-scoped in server actions
  const allFavorites = await getUserFavorites()
  const favorites = allFavorites.filter(f => f.media_type === "movie" || f.media_type === "series")
  const progress = await getUserProgressDB()

  // Calculate detailed stats
  const moviesWatched = progress.filter(p => p.media_type === "movie").length
  const seriesEpisodesWatched = progress.filter(p => p.media_type === "series").reduce((acc, curr) => acc + (curr.episode || 0), 0)

  // Gamified Level & XP calculations
  const totalXP = (moviesWatched * 50) + (seriesEpisodesWatched * 10)
  const level = Math.floor(Math.sqrt(totalXP / 100)) + 1
  const currentLevelStartXP = 100 * (level - 1) * (level - 1)
  const nextLevelNeedXP = 100 * level * level
  const xpInCurrentLevel = totalXP - currentLevelStartXP
  const xpNeededForNextLevel = nextLevelNeedXP - currentLevelStartXP
  const levelProgressPct = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)))

  const levelTitle = level >= 10 ? "Qverse Sovereign 👑" :
                     level >= 7  ? "Anime Sage 📖" :
                     level >= 5  ? "Binge Champion 🏆" :
                     level >= 3  ? "Active Otaku ⚡" :
                                   "Neophyte 🌟"

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <ProfileHeaderClient
        activeProfileId={activeProfile?.id || "default"}
        activeName={activeName}
        activeAvatar={activeAvatar}
        activeBanner={activeBanner}
        userEmail={user.email || ""}
      />

      {/* Multi-Profile Switcher & Management Section */}
      <div className="mb-12">
        <ProfileSwitcher initialProfiles={profiles} activeProfile={activeProfile} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Level & XP Card */}
          <div className="bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 border border-white/5 rounded-2xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none" />
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2 relative z-10">
              <Star className="w-5 h-5 text-yellow-400 fill-current animate-pulse" />
              Qverse Rank
            </h3>
            
            <div className="flex flex-col gap-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Level {level}</span>
                  <h4 className="text-base font-black text-white leading-tight mt-0.5">{levelTitle}</h4>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center font-black text-sm text-primary">
                  {level}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[9px] text-muted-foreground mb-1.5 font-bold">
                  <span>Progress ({totalXP} XP)</span>
                  <span>{xpInCurrentLevel} / {xpNeededForNextLevel} XP ({levelProgressPct}%)</span>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-fuchsia-500 rounded-full transition-all duration-500" 
                    style={{ width: `${levelProgressPct}%` }}
                  />
                </div>
              </div>

              {/* Leveling Badges */}
              <div className="border-t border-white/5 pt-3 mt-1">
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block mb-2">Achievements &amp; Badges</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { title: "Neophyte 🌟", req: 1 },
                    { title: "Otaku ⚡", req: 3 },
                    { title: "Binger 🏆", req: 5 },
                    { title: "Sage 📖", req: 7 },
                    { title: "Sovereign 👑", req: 10 },
                  ].map((b) => {
                    const unlocked = level >= b.req
                    return (
                      <div 
                        key={b.title} 
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all ${
                          unlocked 
                            ? "bg-primary/10 border-primary/20 text-white" 
                            : "bg-white/2 border-transparent opacity-20 filter grayscale"
                        }`}
                        title={unlocked ? `${b.title} Unlocked (Requires Level ${b.req})` : `Locked (Requires Level ${b.req})`}
                      >
                        <span className="text-base leading-none mb-1">{b.title.split(" ")[1]}</span>
                        <span className="text-[6.5px] font-black uppercase tracking-wider line-clamp-1 leading-none">{b.title.split(" ")[0]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-white/5 rounded-2xl p-6 shadow-lg">
            <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-primary" />
              Your Stats
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-secondary/30">
                <span className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Saved Items</span>
                <span className="font-black text-lg text-primary">{favorites.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-secondary/20">
                <span className="text-muted-foreground font-medium text-xs">Movies Watched</span>
                <span className="font-bold text-sm">{moviesWatched}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-secondary/20">
                <span className="text-muted-foreground font-medium text-xs">Episodes Streamed</span>
                <span className="font-bold text-sm">{seriesEpisodesWatched}</span>
              </div>

              {/* Category Distribution chart */}
              {favorites.length > 0 && (
                <div className="border-t border-white/5 pt-4 mt-2">
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block mb-2">Category Distribution</span>
                  <div className="h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5 flex shadow-inner">
                    {(() => {
                      const totalFavs = favorites.length
                      const m = favorites.filter(f => f.media_type === "movie").length
                      const s = favorites.filter(f => f.media_type === "series").length
                      
                      const mp = totalFavs > 0 ? Math.round((m / totalFavs) * 100) : 0
                      const sp = totalFavs > 0 ? 100 - mp : 0

                      return (
                        <>
                          {mp > 0 && <div className="h-full bg-sky-500 transition-all" style={{ width: `${mp}%` }} title={`Movies: ${mp}%`} />}
                          {sp > 0 && <div className="h-full bg-emerald-500 transition-all" style={{ width: `${sp}%` }} title={`Series: ${sp}%`} />}
                        </>
                      )
                    })()}
                  </div>
                  
                  {(() => {
                    const totalFavs = favorites.length
                    const m = favorites.filter(f => f.media_type === "movie").length
                    const s = favorites.filter(f => f.media_type === "series").length
                    
                    const mp = totalFavs > 0 ? Math.round((m / totalFavs) * 100) : 0
                    const sp = totalFavs > 0 ? 100 - mp : 0

                    return (
                      <div className="flex flex-wrap gap-2.5 mt-2.5 text-[8.5px] font-bold justify-center">
                        {mp > 0 && <span className="flex items-center gap-1.5 text-sky-400"><span className="w-1.5 h-1.5 bg-sky-500 rounded-full" /> Movie ({mp}%)</span>}
                        {sp > 0 && <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Series ({sp}%)</span>}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Watchlist Sharing & Importer */}
          <ProfileSettingsClient 
            userId={user.id} 
            isPublicInitial={user.user_metadata?.is_watchlist_public || false} 
          />

          {/* Theme Customization Card */}
          <div className="bg-card border border-white/5 rounded-2xl p-6 shadow-lg">
            <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Theme Styling
            </h3>
            <ThemeCustomizer />
          </div>
        </div>

        {/* Right Col: Recent Activity & Continue Progress */}
        <div className="lg:col-span-2 space-y-10">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                <Clock className="w-6 h-6 text-primary" />
                Recently Added to Watchlist
              </h2>
              <Link href="/watchlist">
                <Button variant="ghost" className="text-muted-foreground">View All</Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {favorites.length === 0 ? (
                <div className="col-span-2 text-center p-12 bg-secondary/10 rounded-2xl border border-white/5">
                  <p className="text-muted-foreground">You haven&apos;t saved anything yet.</p>
                </div>
              ) : (
                favorites.slice(0, 4).map((item) => (
                  <div key={item.id} className="group relative overflow-hidden rounded-xl border border-white/5 bg-secondary/10 hover:bg-secondary/30 transition-all flex items-center p-3 gap-4">
                    <div className="relative w-16 h-24 rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image_url || "/og-banner.png"}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold line-clamp-2 leading-tight mb-1 text-sm">{item.title}</h3>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{item.media_type}</p>
                    </div>
                    <Link 
                      href={`/watch/${item.media_type}/${item.media_id}`} 
                      className="absolute inset-0 z-10"
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pick up where you left off */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                <Play className="w-6 h-6 text-primary" />
                Continue Watching
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {progress.length === 0 ? (
                <div className="col-span-2 text-center p-12 bg-secondary/10 rounded-2xl border border-white/5">
                  <p className="text-muted-foreground">No active progress. Watch a movie or show to resume here!</p>
                </div>
              ) : (
                progress.slice(0, 4).map((item) => {
                  const isSeries = item.media_type === "series"
                  const resumeUrl = `/watch/${item.media_type}/${item.media_id}${isSeries ? `?s=${item.season}&e=${item.episode}` : ""}`

                  return (
                    <div key={item.id} className="group relative overflow-hidden rounded-xl border border-white/5 bg-secondary/10 hover:bg-secondary/30 transition-all flex flex-col justify-between p-4 gap-3">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-16 rounded-md overflow-hidden flex-shrink-0">
                          <Image
                            src={item.image_url || "/og-banner.png"}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold line-clamp-1 leading-tight text-sm mb-1">{item.title}</h3>
                          <p className="text-[10px] text-muted-foreground">
                            {isSeries ? (
                              `Season ${item.season} · Episode ${item.episode}`
                            ) : (
                              `Movie`
                            )}
                          </p>
                        </div>
                      </div>

                      {isSeries && (
                        <div className="w-full">
                          <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
                            <span>Last Streamed</span>
                            <span>Episode {item.episode}</span>
                          </div>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full w-full opacity-60" />
                          </div>
                        </div>
                      )}

                      <Link 
                        href={resumeUrl} 
                        className="absolute inset-0 z-10"
                      />
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
