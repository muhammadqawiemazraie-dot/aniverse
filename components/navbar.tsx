"use client"

import * as React from "react"
import Link from "next/link"
import { Search, Menu, Tv, X, Mic } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ModeToggle } from "@/components/mode-toggle"
import { AuthAvatar } from "@/components/auth-avatar"
import { NotificationBell } from "@/components/notification-bell"
import { SearchSpotlight } from "@/components/search-spotlight"
import type { SuggestionItem } from "@/app/api/search/suggestions/route"

export function Navbar() {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false)
  const mobileInputRef = React.useRef<HTMLInputElement>(null)

  const [suggestions, setSuggestions] = React.useState<SuggestionItem[]>([])
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [isSearchingSuggestions, setIsSearchingSuggestions] = React.useState(false)
  const dropdownRef = React.useRef<HTMLFormElement>(null)
  const mobileDropdownRef = React.useRef<HTMLFormElement>(null)

  const [isListening, setIsListening] = React.useState(false)

  const handleVoiceSearch = () => {
    // SpeechRecognition is a browser-only API not in TS types by default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      alert("Voice search is not supported in this browser.")
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognitionAPI() as any
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = (event: { error: string }) => {
      console.error("Speech recognition error", event.error)
      setIsListening(false)
    }

    recognition.onresult = (event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript
      setSearchQuery(transcript)
    }

    recognition.start()
  }

  React.useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setTimeout(() => {
        setSuggestions([])
        setShowSuggestions(false)
      }, 0)
      return
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearchingSuggestions(true)
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.results || [])
          setShowSuggestions(true)
        }
      } catch (e) {
        console.error("Error fetching suggestions:", e)
      } finally {
        setIsSearchingSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const targetNode = e.target as Node
      const inDesktop = dropdownRef.current && dropdownRef.current.contains(targetNode)
      const inMobile = mobileDropdownRef.current && mobileDropdownRef.current.contains(targetNode)
      if (!inDesktop && !inMobile) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const renderSuggestionsDropdown = () => {
    if (!showSuggestions || searchQuery.trim().length < 2) return null

    return (
      <div 
        className="absolute top-full mt-2 w-[300px] sm:w-[360px] right-0 bg-card border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in duration-200"
      >
        {isSearchingSuggestions && suggestions.length === 0 ? (
          <div className="flex items-center justify-center p-6 text-muted-foreground text-xs gap-2">
            <span className="animate-spin h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full" />
            Searching suggestions...
          </div>
        ) : suggestions.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-xs">
            No matches found for &quot;{searchQuery}&quot;
          </div>
        ) : (
          <div className="flex flex-col max-h-[320px] overflow-y-auto divide-y divide-white/5 scrollbar-thin">
            <div className="p-2.5 text-[10px] text-muted-foreground uppercase font-bold tracking-wider bg-secondary/20">
              Suggestions
            </div>
            {suggestions.map((item) => {
              const href = `/watch/${item.type}/${item.id}`

              return (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={href}
                  onClick={() => {
                    setShowSuggestions(false)
                    setSearchQuery("")
                    setMobileSearchOpen(false)
                  }}
                  className="flex items-center gap-3 p-2.5 hover:bg-secondary/45 transition-all group"
                >
                  <div className="relative w-9 h-12 bg-secondary rounded overflow-hidden flex-shrink-0 border border-white/5">
                    {item.poster ? (
                      <img 
                        src={item.poster} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground font-bold">
                        🎬
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-white truncate group-hover:text-primary transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5 capitalize flex items-center gap-1.5 font-medium">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold text-white ${
                        item.type === "series" ? "bg-emerald-600/80" : "bg-sky-600/80"
                      }`}>
                        {item.type}
                      </span>
                      {item.releaseInfo && <span>· {item.releaseInfo}</span>}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  React.useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 100)
    }
  }, [mobileSearchOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery)}`)
      setMobileSearchOpen(false)
      setSearchQuery("")
    }
  }

  const [spotlightOpen, setSpotlightOpen] = React.useState(false)

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <SearchSpotlight open={spotlightOpen} onOpenChange={setSpotlightOpen} />
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Sheet>
            <SheetTrigger className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px]">
              <div className="flex flex-col gap-6 mt-6">
                <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
                  <Tv className="h-6 w-6" />
                  <span>Qverse</span>
                </Link>
                <nav className="flex flex-col gap-4">
                  <Link href="/" className="text-foreground/80 hover:text-primary transition-colors">Home</Link>
                  <Link href="/browse" className="text-foreground/80 hover:text-primary transition-colors">Explore</Link>
                  <Link href="/genres" className="text-foreground/80 hover:text-primary transition-colors">Genres</Link>
                  <Link href="/schedule" className="text-foreground/80 hover:text-primary transition-colors">📅 Schedule</Link>
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="hidden md:flex items-center gap-2 text-2xl font-bold text-primary tracking-tight">
            <Tv className="h-7 w-7" />
            <span>Qverse</span>
          </Link>
          
          {/* Mobile logo — hidden when mobile search is open */}
          {!mobileSearchOpen && (
            <Link href="/" className="md:hidden flex items-center gap-2 text-xl font-bold text-primary tracking-tight">
              <Tv className="h-6 w-6" />
              <span>Qverse</span>
            </Link>
          )}

          <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium">
            {[
              { href: "/", label: "Home" },
              { href: "/browse", label: "Explore" },
              { href: "/genres", label: "Genres" },
              { href: "/schedule", label: "Schedule" },
            ].map(({ href, label }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative whitespace-nowrap transition-colors ${
                    isActive ? "text-primary" : "text-foreground/80 hover:text-primary"
                  }`}
                >
                  {label}
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full bg-primary" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop Search */}
          <form ref={dropdownRef} onSubmit={handleSearch} className="hidden sm:flex relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search movies, series..."
              className="w-full pl-9 pr-9 bg-secondary/50 border-none rounded-full focus-visible:ring-primary focus-visible:bg-secondary transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            />
            <button
              type="button"
              onClick={() => setSpotlightOpen(true)}
              className="absolute right-9 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 text-[10px] font-bold font-mono px-1.5 py-0.5 bg-background/60 text-muted-foreground rounded border border-border/80 hover:text-foreground hover:border-primary transition-all"
              title="Quick Search Spotlight (Ctrl + S)"
            >
              <span>Ctrl</span>
              <span>+</span>
              <span>S</span>
            </button>
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${
                isListening ? "text-red-500 animate-pulse bg-red-500/10" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Voice Search"
              aria-label="Voice search"
            >
              <Mic className="h-3.5 w-3.5" />
            </button>
            {renderSuggestionsDropdown()}
          </form>

          {/* Mobile Search — expandable */}
          {mobileSearchOpen ? (
            <form ref={mobileDropdownRef} onSubmit={handleSearch} className="sm:hidden flex items-center gap-2 relative animate-in slide-in-from-right-4 duration-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={mobileInputRef}
                  type="search"
                  placeholder="Search..."
                  className="pl-9 pr-9 w-[160px] bg-secondary/80 border-none rounded-full focus-visible:ring-primary transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                />
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${
                    isListening ? "text-red-500 animate-pulse bg-red-500/10" : "text-muted-foreground hover:text-white"
                  }`}
                  title="Voice Search"
                >
                  <Mic className="h-3.5 w-3.5" />
                </button>
              </div>
              {renderSuggestionsDropdown()}
              <button
                type="button"
                onClick={() => { setMobileSearchOpen(false); setSearchQuery("") }}
                className="inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </form>
          ) : (
            <button
              className="sm:hidden inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Open search"
            >
              <Search className="h-5 w-5" />
            </button>
          )}

          <NotificationBell />
          <ModeToggle />

          <Link href="/profile" className="inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors">
              <AuthAvatar />
              <span className="sr-only">Profile</span>
            </Link>
        </div>
      </div>
    </header>
  )
}
