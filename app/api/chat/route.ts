import { NextRequest, NextResponse } from "next/server"
import { fetchTrendingMovies, fetchTrendingSeries, searchCinemeta, fetchCinemetaDetails, fetchByGenre } from "@/lib/cinemeta"
import { createClient } from "@/app/actions/auth"
import { getUserFavorites } from "@/app/actions/favorites"
import { getUserProgressDB } from "@/app/actions/progress"

// ─── Website Knowledge Base ──────────────────────────────────────────────────
const SITE_KNOWLEDGE = `
# Qverse — Complete Website Guide

## What is Qverse?
Qverse is a free, all-in-one streaming platform for Movies, TV Series, and Anime.
It aggregates content from multiple sources. No account is required to browse or watch, but signing up
unlocks features like Watchlist, Watch Party, progress tracking, and personalized recommendations.

## Navigation (Top Navbar)
- **Home** → / — Hero carousel + trending rows + Continue Watching
- **Movies** → /browse?type=movie — Browse/filter all movies
- **TV & Anime** → /browse?type=series — Browse/filter all TV & Anime
- **Genres** → /genres — Browse by genre: Movies, TV & Anime
- **Schedule** → /schedule — Weekly airing schedule for currently broadcasting anime (powered by MyAnimeList/Jikan)
- **Explore** → /browse — Browse all content with filters (year, rating, sort)
- **Search bar** — Search movies and series simultaneously. Supports live results.

## User Account Features (requires login at /login)
- **Watchlist** → /watchlist — Save movies/series to watch later. Statuses: Plan to Watch, Watching, Completed, Dropped
- **Profile** → /profile — View/edit your profile, switch avatar, customize theme colors
- **Progress Tracking** — Automatically tracks what episode you left off on (Continue Watching section)
- **Watch Party** → /watch-party/[room] — Watch movies or series with friends in sync, with live chat
- **AI Recommendations** — Qbot (that's me!) gives personalized suggestions based on your library

## Content Features
- **Video Player** (/watch/movie/[id] or /watch/series/[id]) — Stream movies and series with episode picker, theater mode, subtitle support, speed controls
- **Comments/Reviews** — Leave reviews and star ratings on any movie or series
- **Trailers** — Watch trailers directly on detail pages
- **Similar Content** — Each detail page shows similar titles based on genre

## How to Watch
1. Search for a title using the search bar or browse by genre
2. Click on the movie/series card to go to its detail page
3. Click "Watch Now" or select an episode from the episode list
4. Use the video player controls (speed, theater mode, subtitles)

## Airing Schedule
- The /schedule page shows currently airing anime for each day of the week
- Data is fetched from MyAnimeList (via Jikan API), refreshed every 6 hours
- Click "Search Stream" on any show to find it on Qverse
- Click the bell 🔔 icon to set browser notification reminders for when a show airs

## Genres Available
Movies & Series: Action, Adventure, Animation, Comedy, Crime, Documentary, Drama, Fantasy, Horror, Mystery, Romance, Sci-Fi, Thriller, Western, Family, History, Music, Sport, War

## Theme & Customization
- Light / Dark / System mode toggle (sun/moon icon in navbar)
- Neon Mode (⚡ icon) — electric cyan cyberpunk theme
- Theme color presets in Profile settings: Sakura, Ocean, Emerald, Violet, Amber, Crimson, or custom

## Neon Mode
Click the ⚡ lightning bolt in the navbar to toggle Neon Mode — a high-contrast electric cyan cyberpunk theme.

## Watch Party
- Start a Watch Party from any movie/series watch page, or from Qbot recommendations
- Share the room link with friends
- Watch in sync with real-time chat

## Community Chat (Qbot)
That's me! I'm Qbot, the AI companion. I can answer ANYTHING you ask!
`

// ─── Smart search: live-search any title across all content ──────────────────
async function searchAllContent(query: string) {
  const [movies, series] = await Promise.allSettled([
    searchCinemeta("movie", query).catch(() => []),
    searchCinemeta("series", query).catch(() => []),
  ])

  return {
    movies: movies.status === "fulfilled" ? movies.value.slice(0, 5) : [],
    series: series.status === "fulfilled" ? series.value.slice(0, 5) : [],
  }
}

// ─── Build search context string for the AI ──────────────────────────────────
function buildSearchContext(results: Awaited<ReturnType<typeof searchAllContent>>, query: string): string {
  const parts: string[] = []

  if (results.movies.length > 0) {
    parts.push(`\nSearch results for "${query}" — Movies:\n` +
      results.movies.map(m =>
        `  • "${m.name}" | ID: ${m.id} | Rating: ${m.imdbRating || "N/A"} | Year: ${m.releaseInfo || "N/A"} | Genres: ${m.genres?.join(", ") || "N/A"} | Description: ${m.description?.slice(0, 150) || "N/A"}... | Link: /watch/movie/${m.id}`
      ).join("\n")
    )
  }

  if (results.series.length > 0) {
    parts.push(`\nSearch results for "${query}" — TV Series & Anime:\n` +
      results.series.map(s =>
        `  • "${s.name}" | ID: ${s.id} | Rating: ${s.imdbRating || "N/A"} | Year: ${s.releaseInfo || "N/A"} | Genres: ${s.genres?.join(", ") || "N/A"} | Description: ${s.description?.slice(0, 150) || "N/A"}... | Link: /watch/series/${s.id}`
      ).join("\n")
    )
  }

  if (parts.length === 0) {
    return `\nNo results found for "${query}" on Qverse.`
  }

  return parts.join("\n")
}

// ─── Robust Clean title query extractor ─────────────────────────────────────────
function extractCleanTitle(query: string): string {
  let cleaned = query.trim()

  // Remove leading conversational filler & questions
  cleaned = cleaned.replace(/^(is there any|are there any|is there a|are there|can you |please |could you |would you |i want to |i'd like to |give me |show me )/i, "")
  
  // Remove request intention verbs/phrases
  cleaned = cleaned.replace(/^(explain to me about|explain to me|explain about|explain|tell me about|tell me|what is|what's|who is|info on|info about|information about|synopsis of|plot of|overview of|story of|summary of|details for|details about|search for|search|find|watch)\s+/i, "")
  
  // Remove similar triggers
  cleaned = cleaned.replace(/^(movies?|shows?|series|anime)?\s*(like|similar to|resembling)\s+/i, "")

  // Remove leading 'about', 'the', 'a', 'an'
  cleaned = cleaned.replace(/^(about|the|a|an)\s+/i, "")

  // Remove trailing medium indicators and fillers
  cleaned = cleaned.replace(/\s+(movie|series|anime|tv show|show|film|on qverse|here|about)$/i, "")
  cleaned = cleaned.replace(/\s+(movie|series|anime|tv show|show|film)$/i, "")

  return cleaned.trim().replace(/[?.]/g, "")
}

// ─── Detect if message is a simple greeting ──────────────────────────────────
function isSimpleGreeting(message: string): boolean {
  const clean = message.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"")
  const words = clean.split(/\s+/)
  if (words.length > 4) return false

  const greetings = [
    "hi", "hello", "hey", "yo", "greetings", "whats up", "sup", "howdy", "hola",
    "good morning", "good afternoon", "good evening"
  ]

  const isGreeting = greetings.includes(words[0]) || greetings.includes(clean)
  if (!isGreeting) return false

  const ACTION_KEYWORDS = [
    "recommend", "rec", "recs", "suggest", "suggestion", "trending", "watchlist", "progress", "history", 
    "schedule", "watch", "find", "search", "show", "airing", "episode", 
    "movie", "series", "anime", "play", "party", "clear", "help"
  ]

  return !words.some(word => ACTION_KEYWORDS.includes(word))
}

// ─── Fallback & Smart Intent Handler ──────────────────────────────────────────
async function handleLocalFallback(query: string): Promise<string> {
  const cleanQuery = query.toLowerCase().trim()
  if (!cleanQuery) {
    return `👋 **Hi! I'm Qbot, your Qverse AI companion.** Ask me anything!`
  }

  // 1. Simple Greetings & Help
  if (cleanQuery === "hi" || cleanQuery === "hello" || cleanQuery.includes("help") || cleanQuery.includes("who are you") || cleanQuery === "hey") {
    return `👋 **Hi! I'm Qbot, your Qverse AI companion.**

I can answer **anything** you ask! Try asking:
* 🚀 **"is there any movie like Interstellar?"** — Find similar movies & anime
* 🎬 **"explain to me about Interstellar movie"** — Get plot summaries & details
* 🍿 **"suggest some movies"** / **"recommend anime"** — Get top recommendations
* 🎲 **"Surprise Me!"** — Get a random movie or anime pick
* 📋 **"watchlist"** — See your saved library
* 📅 **"schedule"** — Check the weekly anime broadcast timetable`
  }

  // 2. Account & Profile
  if (cleanQuery.includes("profile") || cleanQuery.includes("logged in") || cleanQuery.includes("who am i") || cleanQuery.includes("account")) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return `👤 **Profile Status:** You are not signed in. Visit [Login Page](/login) to sign in and unlock watchlist, watch parties, and progress tracking!`
      }
      return `👤 **Profile Status:** Logged in as **${user.email}**.\n\nManage your profile at [/profile](/profile).`
    } catch {
      return `👤 Unable to check your session right now.`
    }
  }

  // 3. Watchlist
  if (cleanQuery.includes("watchlist") || cleanQuery.includes("my list") || cleanQuery.includes("favorites") || cleanQuery.includes("library")) {
    try {
      const favorites = await getUserFavorites()
      if (favorites.length === 0) {
        return `🔖 **Your Watchlist is empty.** Browse content and click the bookmark icon to add movies or series. Visit [/watchlist](/watchlist) to see it.`
      }
      let reply = `🔖 **Your Watchlist (${favorites.length} items):**\n\n`
      favorites.forEach(f => {
        const link = `/watch/${f.media_type}/${f.media_id}`
        reply += `* [${f.title}](${link}) _(${f.media_type.toUpperCase()} · ${f.status || "plan_to_watch"})_\n`
      })
      return reply
    } catch {
      return `⚠️ Please [log in](/login) to see your personal watchlist!`
    }
  }

  // 4. Progress Tracking
  if (cleanQuery.includes("progress") || cleanQuery.includes("history") || cleanQuery.includes("last watch") || cleanQuery.includes("continue")) {
    try {
      const progress = await getUserProgressDB()
      if (progress.length === 0) {
        return `⏱️ **No progress logged yet.** Start watching and your history will appear here!`
      }
      let reply = `⏱️ **Your Recent Activity:**\n\n`
      progress.slice(0, 5).forEach(p => {
        const link = `/watch/${p.media_type}/${p.media_id}${p.media_type === "series" ? `?s=${p.season}&e=${p.episode}` : ""}`
        reply += `* [${p.title}](${link}) — ${p.media_type === "series" ? `Season ${p.season} Episode ${p.episode}` : "Movie"}\n`
      })
      return reply
    } catch {
      return `⚠️ Please [log in](/login) to see your tracking history!`
    }
  }

  // 5. Schedule
  if (cleanQuery.includes("schedule") || cleanQuery.includes("airing") || cleanQuery.includes("when does") || cleanQuery.includes("broadcast")) {
    return `📅 **Anime Airing Schedule**\n\nCheck the [Schedule Page](/schedule) for the full weekly anime broadcast timetable.`
  }

  // 6. Random Pick / Surprise Me
  if (cleanQuery.includes("/random") || cleanQuery.includes("surprise") || cleanQuery.includes("random pick")) {
    try {
      const [movies, series] = await Promise.all([
        fetchTrendingMovies().catch(() => []),
        fetchTrendingSeries().catch(() => []),
      ])
      const combined = [...movies.map(m => ({ ...m, type: "movie" })), ...series.map(s => ({ ...s, type: "series" }))]
      if (combined.length > 0) {
        const picked = combined[Math.floor(Math.random() * combined.length)]
        const link = `/watch/${picked.type}/${picked.id}`
        return `🎲 **Qbot Surprise Pick:**\n\nI picked **[${picked.name}](${link})** for you!\n\n⭐ **Rating:** ${picked.imdbRating || "N/A"} · 🗓️ **Release:** ${picked.releaseInfo || "N/A"}\n\nClick the link above to start streaming immediately!`
      }
    } catch (err) {
      console.error("Error picking random item:", err)
    }
  }

  // 7. SIMILAR CONTENT / RECOMMENDATIONS LIKE A SPECIFIC TITLE ("is there any movie like Interstellar?", "shows like Naruto")
  const isLikeQuery = /(?:is there any|are there|movies?|shows?|series|anime)?\s*(?:like|similar to|resembling|if i liked)\s+/i.test(cleanQuery)
  
  if (isLikeQuery) {
    const rawTarget = extractCleanTitle(cleanQuery)
    if (rawTarget.length >= 2) {
      try {
        const results = await searchAllContent(rawTarget)
        const exactMovie = results.movies.find(m => m.name.toLowerCase().includes(rawTarget.toLowerCase()))
        const exactSeries = results.series.find(s => s.name.toLowerCase().includes(rawTarget.toLowerCase()))
        const anchorMatch = exactMovie || exactSeries || results.movies[0] || results.series[0]

        if (anchorMatch) {
          const mediaType = (exactMovie || results.movies.includes(anchorMatch)) ? "movie" : "series"
          const details = await fetchCinemetaDetails(mediaType as "movie" | "series", anchorMatch.id).catch(() => null)

          const anchorTitle = details?.name || anchorMatch.name
          const genres = details?.genres || anchorMatch.genres || ["Sci-Fi", "Action", "Drama"]
          const primaryGenre = genres[0] || "Sci-Fi"

          // Fetch similar content in the same primary genre
          const genreResults = await fetchByGenre(mediaType as "movie" | "series", primaryGenre).catch(() => [])
          const similarList = genreResults.filter(item => item.id !== anchorMatch.id).slice(0, 5)

          if (similarList.length > 0) {
            let reply = `🚀 **Movies & Shows similar to [${anchorTitle}](/watch/${mediaType}/${anchorMatch.id}) (${genres.slice(0, 3).join(", ")}):**\n\n`
            similarList.forEach(item => {
              const link = `/watch/${mediaType}/${item.id}`
              reply += `* 🎬 **[${item.name}](${link})** — ⭐ ${item.imdbRating || "N/A"} (${item.releaseInfo || "N/A"})\n`
              if (item.genres && item.genres.length > 0) {
                reply += `  _${item.genres.slice(0, 3).join(", ")}_\n`
              }
            })
            reply += `\n▶️ Click any title above to watch immediately on Qverse!`
            return reply
          }
        }
      } catch (err) {
        console.error("Error fetching similar content:", err)
      }
    }
  }

  // 8. SPECIFIC TITLE EXPLANATION / DETAILS / SEARCH INTENT
  const isExplainQuery = /(explain|tell me about|what is|what's|info|synopsis|plot|story|about|details|who is)/i.test(cleanQuery)
  const isExplicitRec = /(recommend|suggest|trending|popular|what to watch|give me some|give me options|other than that|something else)/i.test(cleanQuery)

  if (isExplainQuery || !isExplicitRec) {
    const rawTarget = extractCleanTitle(cleanQuery)
    if (rawTarget.length >= 2) {
      try {
        const results = await searchAllContent(rawTarget)
        
        // Smarter title matching: find title that contains rawTarget cleanly first
        const exactMovie = results.movies.find(m => m.name.toLowerCase().includes(rawTarget.toLowerCase()))
        const exactSeries = results.series.find(s => s.name.toLowerCase().includes(rawTarget.toLowerCase()))
        const topMatch = exactMovie || exactSeries || results.movies[0] || results.series[0]

        if (topMatch) {
          const mediaType = (exactMovie || results.movies.includes(topMatch)) ? "movie" : "series"
          const details = await fetchCinemetaDetails(mediaType as "movie" | "series", topMatch.id).catch(() => null)

          const title = details?.name || topMatch.name
          const rating = details?.imdbRating || topMatch.imdbRating || "N/A"
          const year = details?.releaseInfo || topMatch.releaseInfo || "N/A"
          const genres = details?.genres?.join(", ") || topMatch.genres?.join(", ") || "N/A"
          const description = details?.description || topMatch.description || "No synopsis available."
          const director = details?.director?.join(", ")
          const cast = details?.cast?.slice(0, 4).join(", ")
          const link = `/watch/${mediaType}/${topMatch.id}`

          let reply = `🎬 **[${title}](${link})** (${year}) — ⭐ ${rating}\n`
          reply += `🏷️ **Genres:** ${genres}\n`
          if (director) reply += `👤 **Director:** ${director}\n`
          if (cast) reply += `🎭 **Cast:** ${cast}\n`
          reply += `\n📖 **Synopsis / Explanation:**\n${description}\n\n`
          reply += `▶️ **[Click here to watch ${title} on Qverse](${link})**`

          return reply
        }
      } catch (err) {
        console.error("Error fetching title explanation:", err)
      }
    }
  }

  // 9. EXPLICIT RECOMMENDATIONS / SUGGESTIONS
  try {
    const wantMovie = cleanQuery.includes("movie") || cleanQuery.includes("film")
    const wantAnime = cleanQuery.includes("anime")
    const isFollowUpRec = /(other than|different|something else|give me more|another|besides|else|instead|others)/i.test(cleanQuery)

    const [movies, series] = await Promise.all([
      fetchTrendingMovies().catch(() => []),
      fetchTrendingSeries().catch(() => []),
    ])

    let displayMovies = movies
    let displaySeries = series
    if (isFollowUpRec) {
      displayMovies = [...movies].sort(() => 0.5 - Math.random())
      displaySeries = [...series].sort(() => 0.5 - Math.random())
    }

    let response = isFollowUpRec
      ? `🍿 **Here are some fresh alternative recommendations for you:**\n\n`
      : `🎬 **Here are top recommendations on Qverse right now:**\n\n`

    if (displayMovies.length > 0) {
      const label = wantAnime ? "🎬 Anime Movies:" : "🎬 Recommended Movies:"
      response += `${label}\n`
      displayMovies.slice(0, wantMovie ? 5 : 4).forEach(m => {
        response += `* [${m.name}](/watch/movie/${m.id}) — ⭐ ${m.imdbRating || "N/A"} (${m.releaseInfo || "N/A"})\n`
      })
      response += "\n"
    }

    if (!wantMovie && displaySeries.length > 0) {
      response += `📺 TV Series & Anime:\n`
      displaySeries.slice(0, wantAnime ? 5 : 3).forEach(s => {
        response += `* [${s.name}](/watch/series/${s.id}) — ⭐ ${s.imdbRating || "N/A"} (${s.releaseInfo || "N/A"})\n`
      })
      response += "\n"
    }

    return response
  } catch {
    return `🎬 Explore top movies and series on our [Browse Page](/browse) or [Genres Page](/genres)!`
  }
}

// Helper to stream a static string over chunk-by-chunk to simulate streaming
function streamText(text: string) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const words = text.split(" ")
      let index = 0
      
      function pushNext() {
        if (index >= words.length) {
          controller.close()
          return
        }
        const chunk = (index > 0 ? " " : "") + words.slice(index, index + 3).join(" ")
        index += 3
        controller.enqueue(encoder.encode(chunk))
        setTimeout(pushNext, 35)
      }
      
      pushNext()
    }
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive"
    }
  })
}

// ─── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let lastUserMessage = ""

  try {
    const body = await req.json()
    const { messages, currentPath, personality } = body
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 })
    }

    lastUserMessage = messages[messages.length - 1]?.content || ""

    if (isSimpleGreeting(lastUserMessage)) {
      const greetingMessages = {
        default: "👋 **Hi! I'm Qbot, your Qverse AI companion.**\n\nHow can I help you find your next movie, series, or anime today?",
        sage: "☯️ **Greetings, my young apprentice.**\n\nSeeker of wisdom, the path of anime and movies lies open before you. What epic quest or search query shall we embark upon today?",
        critic: "🎬 **Greetings. Welcome to the Qverse cinema archive.**\n\nI am ready to analyze screenplay structures, character arcs, and cinematic masterpieces. What title shall we critique or discuss today?",
        buddy: "🍿 **Yo! What's up, dude?**\n\nReady to binge some epic shows or grab some popcorn for a killer movie? Let me know what you're in the mood for, bro!"
      }
      const reply = greetingMessages[personality as keyof typeof greetingMessages] || greetingMessages.default
      return streamText(reply)
    }

    const groqApiKey = process.env.GROQ_API_KEY
    const geminiApiKey = process.env.GEMINI_API_KEY

    if (!groqApiKey && !geminiApiKey) {
      const fallbackReply = await handleLocalFallback(lastUserMessage)
      return streamText(fallbackReply)
    }

    // ── Gather context concurrently ──────────────────────────────────────────
    let userContext = "User is not logged in."
    let trendingContext = "Trending context unavailable."
    let liveSearchContext = ""
    let currentPageContext = ""

    // Detect if user is asking about a specific title → run live search
    const titleQuery = extractCleanTitle(lastUserMessage)

    const contextPromises: Promise<void>[] = []

    // Page Context Awareness
    if (currentPath && typeof currentPath === "string") {
      const match = currentPath.match(/\/watch\/(movie|series)\/([^?#/]+)/)
      if (match) {
        const mediaType = match[1] as "movie" | "series"
        const mediaId = match[2]
        contextPromises.push((async () => {
          try {
            const details = await fetchCinemetaDetails(mediaType, mediaId)
            if (details) {
              currentPageContext = `
USER'S ACTIVE PAGE CONTEXT:
The user is currently on the watch page for: "${details.name}" (ID: ${mediaId}, Type: ${mediaType}).
Details of this item:
- Title: "${details.name}"
- Rating: ${details.imdbRating || "N/A"}
- Release Info: ${details.releaseInfo || "N/A"}
- Genres: ${details.genres?.join(", ") || "N/A"}
- Description: ${details.description || "N/A"}
If the user asks "what is this", "tell me about this show", "who plays in this", "recommend something like this", etc., prioritize answering based on this active title.
`
            }
          } catch (e) {
            console.error("Error fetching context page details:", e)
          }
        })())
      }
    }

    // User context + trending
    contextPromises.push((async () => {
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const [movies, series, favorites, progress] = await Promise.all([
          fetchTrendingMovies().catch(() => []),
          fetchTrendingSeries().catch(() => []),
          user ? getUserFavorites().catch(() => []) : Promise.resolve([]),
          user ? getUserProgressDB().catch(() => []) : Promise.resolve([]),
        ])

        if (user) {
          userContext = `User is logged in as ${user.email}.
Watchlist (${favorites.length} items): ${favorites.length > 0 ? favorites.map(f => `"${f.title}" (${f.media_type}, status: ${f.status || "plan_to_watch"}, id: ${f.media_id})`).join("; ") : "empty"}
Watch Progress: ${progress.length > 0 ? progress.slice(0, 5).map(p => `"${p.title}" (${p.media_type}${p.season ? `, S${p.season}E${p.episode}` : ""}, id: ${p.media_id})`).join("; ") : "none yet"}`
        }

        const movieList = movies.slice(0, 6).map(m => `"${m.name}" (movie, id:${m.id}, rating:${m.imdbRating || "N/A"}, year:${m.releaseInfo || "N/A"}, genres:${m.genres?.slice(0, 3).join(",") || "N/A"})`).join("; ")
        const seriesList = series.slice(0, 6).map(s => `"${s.name}" (series, id:${s.id}, rating:${s.imdbRating || "N/A"}, year:${s.releaseInfo || "N/A"}, genres:${s.genres?.slice(0, 3).join(",") || "N/A"})`).join("; ")

        trendingContext = `Trending Movies: ${movieList || "none"}
Trending Series/Anime: ${seriesList || "none"}`
      } catch (e) {
        console.error("Context fetch error:", e)
      }
    })())

    // Live search if title is mentioned
    if (titleQuery && titleQuery.length >= 2) {
      contextPromises.push((async () => {
        try {
          const results = await searchAllContent(titleQuery)
          liveSearchContext = buildSearchContext(results, titleQuery)
        } catch (e) {
          console.error("Live search error:", e)
        }
      })())
    }

    await Promise.all(contextPromises)

    // AI Personalities directives
    const personalities = {
      default: "Standard friendly and helpful Qbot AI companion.",
      sage: "You are the 'Anime Sage'. Speak like an ancient, wise anime master. Use phrases like 'my young apprentice', quote anime/zen philosophy, and use terms like 'Chakra', 'Ki', or 'Nen'. Your tone is calm, wise, and dramatic.",
      critic: "You are the 'Film Critic'. Speak like an intellectual, witty film scholar. Analyze camera work, screenplay structure, acting, pacing, and director vision. Provide rigorous and slightly analytical critiques.",
      buddy: "You are the 'Chill Movie Buddy'. Speak like a relaxed, casual friend who loves binging shows. Use words like 'dude', 'bro', 'lit', 'solid choice', and keep recommendations super casual, direct, and witty."
    }

    const activePersonalityDesc = personalities[personality as keyof typeof personalities] || personalities.default

    // ── Build system prompt ──────────────────────────────────────────────────
    const systemPrompt = `You are Qbot — the friendly, highly knowledgeable AI companion for Qverse, a free streaming platform.

PERSONALITY DIRECTIVE:
${activePersonalityDesc}

UNIVERSAL KNOWLEDGE DIRECTIVE:
You are a full conversational AI assistant. You can answer ANYTHING the user asks — including general knowledge, science, philosophy, pop culture, history, movie lore, anime trivia, recipes, writing, coding, or casual chit-chat.
- ALWAYS answer the user's question directly, accurately, and naturally.
- Never refuse to answer or tell the user you can only talk about site features.

Real-time context:
${SITE_KNOWLEDGE}

REAL-TIME USER CONTEXT:
${userContext}

CURRENTLY TRENDING ON QVERSE:
${trendingContext}

${currentPageContext ? `${currentPageContext}` : ""}

${liveSearchContext ? `LIVE SEARCH RESULTS (use these to answer the user's specific title question):
${liveSearchContext}` : ""}

CRITICAL LINK RULES:
- Movies: [Title](/watch/movie/[imdb_id]) e.g. [Interstellar](/watch/movie/tt0816692)
- Series/Anime: [Title](/watch/series/[imdb_id]) e.g. [Naruto](/watch/series/tt0988824)
- Site pages: [Schedule](/schedule), [Browse](/browse), [Genres](/genres), [Search](/search?q=...), [Watchlist](/watchlist), [Profile](/profile), [Login](/login)
- NEVER link to external sites (imdb.com, etc.)
- ALWAYS use the IDs from your context data when linking to titles

CRITICAL ANSWER GUIDELINES:
1. ALWAYS ANSWER PRECISELY WHAT WAS ASKED:
   - If the user asks for movies/shows similar to a title (e.g. "is there any movie like Interstellar?", "shows like Naruto"), provide a list of top similar movies or anime with working stream links!
   - If the user asks to explain a specific title (e.g. "explain to me about interstellar movie"), provide a detailed plot summary, rating, genres, and stream link!
2. For recommendations:
   - Give 3-5 suggestions formatted with working stream links.
3. Keep responses clear, helpful, and concise.`

    let lastError = ""

    // Try Groq first if key exists
    if (groqApiKey) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqApiKey}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map((m: any) => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.content
              }))
            ],
            temperature: 0.75,
            max_tokens: 1024,
            stream: true
          })
        })

        if (response.ok && response.body) {
          const encoder = new TextEncoder()
          const decoder = new TextDecoder()
          const reader = response.body.getReader()
          let buffer = ""

          const stream = new ReadableStream({
            async start(controller) {
              try {
                while (true) {
                  const { done, value } = await reader.read()
                  if (done) break

                  buffer += decoder.decode(value, { stream: true })
                  const lines = buffer.split("\n")
                  buffer = lines.pop() || ""

                  for (const line of lines) {
                    const cleanLine = line.trim()
                    if (!cleanLine) continue
                    if (cleanLine === "data: [DONE]") continue

                    if (cleanLine.startsWith("data: ")) {
                      try {
                        const json = JSON.parse(cleanLine.slice(6))
                        const content = json.choices?.[0]?.delta?.content || ""
                        if (content) {
                          controller.enqueue(encoder.encode(content))
                        }
                      } catch {}
                    }
                  }
                }
              } catch (e) {
                console.error("Groq stream processing error:", e)
              } finally {
                controller.close()
              }
            }
          })

          return new NextResponse(stream, {
            headers: {
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              "Connection": "keep-alive"
            }
          })
        } else {
          const err = await response.text()
          lastError = `Groq API stream error: ${response.status} - ${err}`
          console.error(lastError)
        }
      } catch (e) {
        lastError = `Groq Fetch stream error: ${(e as Error).message}`
        console.error(lastError)
      }
    }

    // Fallback to Gemini if Groq failed or wasn't configured
    if (geminiApiKey) {
      const formattedContents = messages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }))

      const MODELS_TO_TRY = [
        "gemini-2.0-flash",
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-pro",
      ]

      for (const model of MODELS_TO_TRY) {
        try {
          const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`

          const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: formattedContents,
              systemInstruction: { parts: [{ text: systemPrompt }] },
              generationConfig: {
                temperature: 0.75,
                maxOutputTokens: 800,
                topP: 0.9,
              }
            })
          })

          if (response.ok) {
            const data = await response.json()
            const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || null
            if (resultText) {
              return streamText(resultText)
            }
          } else {
            const err = await response.text()
            lastError = `Gemini ${model} error: ${response.status} - ${err}`
            if (response.status !== 404) {
              console.error(lastError)
              break
            }
          }
        } catch (e) {
          lastError = `Gemini ${model} fetch error: ${(e as Error).message}`
        }
      }
    }

    // If both Groq & Gemini failed or were invalid, run local fallback with preserved lastUserMessage
    const fallbackReply = await handleLocalFallback(lastUserMessage)
    return streamText(fallbackReply)
  } catch (error) {
    console.error("Chat API error:", error)
    try {
      const fallback = await handleLocalFallback(lastUserMessage)
      return streamText(fallback)
    } catch {
      return streamText("🎬 Check out top movies on our [Browse Page](/browse) or [Genres Page](/genres)!")
    }
  }
}
