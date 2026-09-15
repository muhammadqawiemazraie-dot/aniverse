"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, Search, Star, Clock, Bell, BellOff } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import type { ScheduleItem } from "@/app/schedule/page"

interface ScheduleTabsProps {
  initialGrouped: Record<string, ScheduleItem[]>
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

function getCountdown(timeStr?: string | null): string | null {
  if (!timeStr) return null
  const parts = timeStr.split(":")
  if (parts.length < 2) return null
  const targetHour = parseInt(parts[0])
  const targetMin = parseInt(parts[1])
  if (isNaN(targetHour) || isNaN(targetMin)) return null

  const now = new Date()
  const target = new Date()
  target.setHours(targetHour, targetMin, 0, 0)

  const diffMs = target.getTime() - now.getTime()
  if (diffMs <= 0 && diffMs > -3600000) {
    return "🔴 Airing Now"
  } else if (diffMs > 0 && diffMs < 86400000) {
    const hours = Math.floor(diffMs / 3600000)
    const mins = Math.floor((diffMs % 3600000) / 60000)
    return `⏱️ In ${hours > 0 ? `${hours}h ` : ""}${mins}m`
  }
  return null
}

export function ScheduleTabs({ initialGrouped }: ScheduleTabsProps) {
  const [activeDay, setActiveDay] = React.useState("")
  const [reminders, setReminders] = React.useState<number[]>([])

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("qverse-schedule-reminders") || localStorage.getItem("aniverse-schedule-reminders")
      if (saved) {
        setTimeout(() => setReminders(JSON.parse(saved)), 0)
      }
    } catch {}
  }, [])

  // Airing broadcast background tracker
  React.useEffect(() => {
    if (reminders.length === 0) return

    const checkAiring = () => {
      const now = new Date()
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      const currentDay = days[now.getDay()]
      const currentHour = now.getHours()
      const currentMin = now.getMinutes()

      const allShows = Object.values(initialGrouped).flat()
      
      reminders.forEach(id => {
        const show = allShows.find(s => s.mal_id === id)
        if (!show || !show.broadcast) return

        const broadcastStr = (show.broadcast.day || show.broadcast.string || "").toLowerCase()
        const showTime = show.broadcast.time
        const currentDaySingular = currentDay.toLowerCase()

        if (broadcastStr.includes(currentDaySingular) && showTime) {
          const [hStr, mStr] = showTime.split(":")
          const showHour = parseInt(hStr)
          const showMin = parseInt(mStr)

          if (showHour === currentHour && showMin === currentMin) {
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification(`📺 Now Airing: ${show.title}`, {
                body: `A new episode of ${show.title} is now broadcasting! Stream it on Qverse.`,
                icon: show.images.jpg?.image_url || "/og-banner.png"
              })
            }
          }
        }
      })
    }

    checkAiring()
    const interval = setInterval(checkAiring, 60000)
    return () => clearInterval(interval)
  }, [reminders, initialGrouped])

  const toggleReminder = async (showId: number, title: string) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        await Notification.requestPermission()
      }
    }

    setReminders(prev => {
      let next
      if (prev.includes(showId)) {
        next = prev.filter(id => id !== showId)
        toast.info(`Reminder disabled for ${title}`)
      } else {
        next = [...prev, showId]
        toast.success(`Reminder enabled for ${title}! We will alert you when it airs.`)
      }
      try {
        localStorage.setItem("qverse-schedule-reminders", JSON.stringify(next))
      } catch {}
      return next
    })
  }

  React.useEffect(() => {
    // Determine current day of the week
    const dayIndex = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
    const dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const todayName = dayMap[dayIndex]
    setTimeout(() => setActiveDay(todayName), 0)
  }, [])

  const currentDayIndex = new Date().getDay()
  const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][currentDayIndex]

  const activeShows = initialGrouped[activeDay] || []

  return (
    <div className="space-y-8">
      {/* Calendar Day Buttons */}
      <div className="flex gap-2 pb-3 overflow-x-auto scrollbar-hide border-b border-white/5">
        {DAYS.map((day) => {
          const count = initialGrouped[day]?.length || 0
          const isToday = day === todayName
          const isActive = day === activeDay

          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`flex-shrink-0 px-4 py-3 rounded-2xl transition-all duration-300 flex flex-col items-center gap-1 min-w-[90px] border ${
                isActive
                  ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.03]"
                  : "bg-secondary/20 hover:bg-secondary/40 border-white/5 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-xs font-black tracking-tight">{day.substring(0, 3)}</span>
              <span className="text-[10px] font-bold opacity-60">{day}</span>
              <div className="flex items-center gap-1.5 mt-1.5">
                {isToday && (
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-white" : "bg-primary"} animate-pulse`} />
                )}
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                  isActive ? "bg-black/20 text-white" : "bg-secondary text-muted-foreground"
                }`}>
                  {count}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Airing Cards List */}
      {activeShows.length === 0 ? (
        <div className="text-center py-16 bg-secondary/10 rounded-2xl border border-white/5">
          <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold">No Airing Anime Scheduled</h3>
          <p className="text-sm text-muted-foreground mt-1">There are no updates from MyAnimeList for {activeDay}.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {activeShows.map((show) => {
            const poster = show.images?.jpg?.large_image_url || show.images?.jpg?.image_url
            const broadcastStr = show.broadcast?.string || `${show.broadcast?.day} at ${show.broadcast?.time}`
            const score = show.score

            return (
              <div
                key={show.mal_id}
                className="p-4 bg-secondary/15 hover:bg-secondary/20 border border-white/5 rounded-2xl flex gap-4 transition-all duration-300 group"
              >
                {/* Poster */}
                <div className="relative w-24 h-36 rounded-xl overflow-hidden bg-secondary flex-shrink-0 shadow-lg border border-white/5">
                  {poster ? (
                    <Image
                      src={poster}
                      alt={show.title}
                      fill
                      sizes="96px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-muted-foreground/45" />
                    </div>
                  )}
                  {score && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-md rounded-lg px-1.5 py-0.5 text-[10px] text-yellow-400 font-bold">
                      <Star className="w-3 h-3 fill-current" />
                      {score.toFixed(1)}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-sm sm:text-base text-white line-clamp-1 group-hover:text-primary transition-colors">
                      {show.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span className="line-clamp-1">{broadcastStr}</span>
                      </div>
                      {activeDay === todayName && getCountdown(show.broadcast?.time) && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 animate-pulse">
                          {getCountdown(show.broadcast?.time)}
                        </span>
                      )}
                    </div>
                    {show.synopsis && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {show.synopsis}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 flex items-center justify-between">
                    <Link href={`/search?q=${encodeURIComponent(show.title)}`}>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-[10px] h-8 px-3 rounded-lg flex items-center gap-1.5 font-bold hover:bg-primary hover:text-primary-foreground transition-all"
                      >
                        <Search className="w-3 h-3" />
                        Search Stream
                      </Button>
                    </Link>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleReminder(show.mal_id, show.title)}
                      className={`h-8 w-8 rounded-lg transition-colors ${
                        reminders.includes(show.mal_id)
                          ? "text-primary hover:text-primary/80 bg-primary/10"
                          : "text-muted-foreground hover:text-white"
                      }`}
                      title={reminders.includes(show.mal_id) ? "Remove airing reminder" : "Remind me when airing"}
                    >
                      {reminders.includes(show.mal_id) ? (
                        <Bell className="w-4 h-4 fill-current animate-pulse text-primary" />
                      ) : (
                        <BellOff className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
