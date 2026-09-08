import Link from "next/link"
import { Tv, Globe, Share2, Heart } from "lucide-react"

const GENRES = ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Romance", "Thriller", "Animation"]

export function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden">
      {/* Top gradient divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 py-14 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-2xl font-black text-primary tracking-tight mb-4">
              <Tv className="h-7 w-7" />
              <span>Qverse</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your all-in-one destination for Movies, TV Series, and Anime. Discover, track, and stream — all for free.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="#" aria-label="Website"
                className="p-2 rounded-full bg-secondary/50 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-all border border-border/50 hover:border-primary/40">
                <Globe className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Share"
                className="p-2 rounded-full bg-secondary/50 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-all border border-border/50 hover:border-primary/40">
                <Share2 className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-5 text-foreground/80">Navigate</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                { label: "Home", href: "/" },
                { label: "Movies", href: "/#movies" },
                { label: "TV & Anime", href: "/#series" },
                { label: "Browse A–Z", href: "/browse" },
                { label: "All Genres", href: "/genres" },
                { label: "My Watchlist", href: "/watchlist" },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Genres */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-5 text-foreground/80">Genres</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {GENRES.map(g => (
                <li key={g}>
                  <Link href={`/genres/${encodeURIComponent(g)}?type=movie`}
                    className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">
                    {g}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-5 text-foreground/80">Legal</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                { label: "Terms of Service", href: "/terms" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "DMCA", href: "/dmca" },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-200/70 leading-relaxed">
              ⚠️ This site embeds third-party players. We do not host any content.
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Qverse. All rights reserved. Metadata by Cinemeta API.</p>
          <p className="flex items-center gap-1.5">
            Made with <Heart className="w-3 h-3 text-red-400 fill-current" /> for anime & film lovers
          </p>
        </div>
      </div>
    </footer>
  )
}
