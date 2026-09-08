"use client"

import * as React from "react"
import { Bell, Film, Sparkles, Tv, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export interface NotificationItem {
  id: string
  title: string
  message: string
  timestamp: string
  read: boolean
  type: "episode" | "schedule" | "system"
  link?: string
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "New Episode Available",
    message: "One Piece Episode 1115 is now ready to stream in HD!",
    timestamp: "10m ago",
    read: false,
    type: "episode",
    link: "/watch/series/tt0388629?s=21&e=1115"
  },
  {
    id: "2",
    title: "Weekly Release Update",
    message: "Demon Slayer Hashira Training Arc Episode 8 has dropped.",
    timestamp: "2h ago",
    read: false,
    type: "episode",
    link: "/watch/series/tt9335498?s=4&e=8"
  },
  {
    id: "3",
    title: "Schedule Reminder",
    message: "Jujutsu Kaisen Season 3 scheduled broadcast coming soon.",
    timestamp: "1d ago",
    read: true,
    type: "schedule",
    link: "/schedule"
  }
]

export function NotificationBell() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("qverse-notifications")
      if (saved) {
        try { return JSON.parse(saved) } catch (e) {}
      }
    }
    return INITIAL_NOTIFICATIONS
  })

  const [permission, setPermission] = React.useState<NotificationPermission>("default")
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission)
    }
  }, [])

  // Close popover when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const saveNotifications = (items: NotificationItem[]) => {
    setNotifications(items)
    if (typeof window !== "undefined") {
      localStorage.setItem("qverse-notifications", JSON.stringify(items))
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }))
    saveNotifications(updated)
    toast.success("All notifications marked as read")
  }

  const requestPushPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === "granted") {
        toast.success("Desktop & Mobile Notifications enabled!")
        new Notification("Qverse Notifications Active", {
          body: "You will now receive alerts for new episode releases!",
          icon: "/favicon.ico"
        })
      } else {
        toast.error("Notification permission denied")
      }
    }
  }

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "episode": return <Tv className="w-4 h-4 text-primary" />
      case "schedule": return <Calendar className="w-4 h-4 text-emerald-400" />
      default: return <Sparkles className="w-4 h-4 text-amber-400" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 rounded-full hover:bg-accent"
      >
        <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground animate-in zoom-in-50">
            {unreadCount}
          </span>
        )}
        <span className="sr-only">Notifications</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 p-0 rounded-2xl border border-white/10 shadow-2xl bg-card/95 backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Bell className="w-4 h-4 text-primary" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-[10px] bg-primary/20 text-primary">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-xs text-muted-foreground hover:text-foreground">
                Mark all read
              </Button>
            )}
          </div>

          {permission !== "granted" && (
            <div className="p-3 bg-primary/10 border-b border-primary/20 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Enable desktop release alerts</span>
              <Button size="sm" variant="default" className="h-6 text-[10px] font-bold px-2" onClick={requestPushPermission}>
                Enable
              </Button>
            </div>
          )}

          <div className="max-h-[340px] overflow-y-auto divide-y divide-white/5 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No notifications at this time.
              </div>
            ) : (
              notifications.map((item) => (
                <a
                  key={item.id}
                  href={item.link || "#"}
                  onClick={() => {
                    const updated = notifications.map(n => n.id === item.id ? { ...n, read: true } : n)
                    saveNotifications(updated)
                    setIsOpen(false)
                  }}
                  className={`flex gap-3 p-3.5 hover:bg-secondary/30 transition-colors ${
                    !item.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="p-2 rounded-xl bg-secondary flex-shrink-0 h-fit border border-white/5">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h5 className={`text-xs font-bold truncate ${!item.read ? "text-white" : "text-muted-foreground"}`}>
                        {item.title}
                      </h5>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{item.timestamp}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
