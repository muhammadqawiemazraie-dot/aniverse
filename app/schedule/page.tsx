import type { Metadata } from "next"
import { Calendar } from "lucide-react"

import { ScheduleTabs } from "@/components/schedule-tabs"

export const metadata: Metadata = {
  title: "Airing Schedule - Qverse",
  description: "Stay up to date with the latest airing anime episodes and TV series releases on Qverse.",
}

// Revalidate page cache every 6 hours (21600 seconds)
export const revalidate = 21600

const FALLBACK_SHOWS = [
  {
    mal_id: 52991,
    title: "Frieren: Beyond Journey's End",
    broadcast: { day: "Fridays", time: "23:00" },
    score: 9.39,
    synopsis: "An elf mage and her former party members' journey.",
    images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1015/138025.jpg" } }
  },
  {
    mal_id: 55644,
    title: "Solo Leveling",
    broadcast: { day: "Saturdays", time: "23:30" },
    score: 8.5,
    synopsis: "In a world of hunters and dungeons, a weak hunter becomes strong.",
    images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1841/140656.jpg" } }
  },
  {
    mal_id: 34572,
    title: "Black Clover",
    broadcast: { day: "Tuesdays", time: "18:25" },
    score: 8.1,
    synopsis: "Asta and Yuno are orphans who want to become the Wizard King.",
    images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/2/88334.jpg" } }
  },
  {
    mal_id: 51009,
    title: "Jujutsu Kaisen Season 2",
    broadcast: { day: "Thursdays", time: "23:56" },
    score: 8.8,
    synopsis: "The past of Satoru Gojo and Suguru Geto, and the Shibuya Incident.",
    images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1792/138022.jpg" } }
  },
  {
    mal_id: 52406,
    title: "Demon Slayer: Hashira Training Arc",
    broadcast: { day: "Sundays", time: "23:15" },
    score: 8.4,
    synopsis: "Tanjiro goes to see the Stone Hashira, Himejima, to prepare for battles.",
    images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1647/140237.jpg" } }
  },
  {
    mal_id: 50265,
    title: "Spy x Family Season 2",
    broadcast: { day: "Saturdays", time: "23:00" },
    score: 8.2,
    synopsis: "Loid, Yor, and Anya continue their undercover family dynamic.",
    images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1506/138768.jpg" } }
  },
  {
    mal_id: 54112,
    title: "My Hero Academia Season 7",
    broadcast: { day: "Saturdays", time: "17:30" },
    score: 8.3,
    synopsis: "The conflict between Heroes and Villains reaches its climax.",
    images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1169/142385.jpg" } }
  }
]

export interface ScheduleItem {
  mal_id: number
  title: string
  broadcast?: {
    day?: string | null
    time?: string | null
    timezone?: string | null
    string?: string | null
  } | null
  score?: number | null
  synopsis?: string | null
  images: {
    jpg?: {
      image_url?: string | null
      small_image_url?: string | null
      large_image_url?: string | null
    } | null
  }
}

export default async function SchedulePage() {
  const dayMap: Record<string, string> = {
    mondays: "Monday", tuesdays: "Tuesday", wednesdays: "Wednesday",
    thursdays: "Thursday", fridays: "Friday", saturdays: "Saturday", sundays: "Sunday"
  }

  const grouped: Record<string, ScheduleItem[]> = {
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
  }

  let items: ScheduleItem[] = []
  try {
    const DAYS_FILTER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    const dayResults = await Promise.allSettled(
      DAYS_FILTER.map(day =>
        fetch(`https://api.jikan.moe/v4/schedules?filter=${day}&limit=25`, {
          next: { revalidate: 21600 },
        }).then(r => r.ok ? r.json() : Promise.reject(r.status))
      )
    )
    for (const result of dayResults) {
      if (result.status === "fulfilled" && result.value?.data) {
        items = items.concat(result.value.data)
      }
    }
    if (items.length === 0) {
      console.warn("Jikan API returned empty data for all days")
    }
  } catch (e) {
    console.error("Failed to fetch schedules from Jikan API:", e)
  }

  if (!items || items.length === 0) {
    items = FALLBACK_SHOWS
  }

  // Group shows by day of the week
  for (const item of items) {
    const broadcastStr = (item.broadcast?.day || item.broadcast?.string || "").toLowerCase()
    let placed = false
    
    for (const [key, val] of Object.entries(dayMap)) {
      // key is "mondays", "tuesdays", etc. We look for "monday", "tuesday", etc.
      const singularKey = key.slice(0, -1)
      if (broadcastStr.includes(singularKey)) {
        grouped[val].push(item)
        placed = true
        break
      }
    }
    
    // Fallback if we couldn't match
    if (!placed) {
      grouped["Sunday"].push(item)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-primary" />
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">Anime Airing Schedule</h1>
        </div>
        <p className="text-muted-foreground text-sm max-w-xl">
          Weekly timetable for ongoing anime broadcasts. Find out when the next episode airs and search for streams on Qverse!
        </p>
      </div>

      {/* Interactive Tabs List */}
      <ScheduleTabs initialGrouped={grouped} />
    </div>
  )
}
