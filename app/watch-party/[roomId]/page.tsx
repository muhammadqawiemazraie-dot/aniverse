"use client"

import * as React from "react"
import { useSearchParams, useRouter, useParams } from "next/navigation"
import { Users, Send, Video, Copy, Check, Shield, LogOut, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VideoPlayer } from "@/components/video-player"
import { createSupabaseClient } from "@/lib/supabase-client"

interface PartyMessage {
  id: string
  username: string
  text: string
  timestamp: string
}

interface Member {
  presenceRef: string
  username: string
  isHost: boolean
}

function generateRandomId() {
  return Math.random().toString(36).substring(2, 9)
}

function generateRandomLeft() {
  return `${15 + Math.random() * 70}%`
}

export default function WatchPartyRoom() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const roomId = params.roomId as string

  // Media parameters from URL search
  const mediaId = searchParams.get("id") || ""
  const mediaType = (searchParams.get("type") || "movie") as "movie" | "series"
  const urlSeason = searchParams.get("s") ? parseInt(searchParams.get("s")!) : 1
  const urlEpisode = searchParams.get("e") ? parseInt(searchParams.get("e")!) : 1
  const isUrlHost = searchParams.get("host") === "true"

  // Room states
  const [username, setUsername] = React.useState(() => {
    if (typeof window === "undefined") return `User_${Math.floor(1000 + Math.random() * 9000)}`
    return localStorage.getItem("aniverse-active-profile-name") || `User_${Math.floor(1000 + Math.random() * 9000)}`
  })
  const [joined, setJoined] = React.useState(false)
  const [isHost] = React.useState(isUrlHost)
  
  // Realtime media state (synchronized from host)
  const [roomMediaId, setRoomMediaId] = React.useState(mediaId)
  const [roomMediaType, setRoomMediaType] = React.useState(mediaType)
  const [season, setSeason] = React.useState(urlSeason)
  const [episode, setEpisode] = React.useState(urlEpisode)

  // Chat & Members states
  const [messages, setMessages] = React.useState<PartyMessage[]>([])
  const [chatInput, setChatInput] = React.useState("")
  const [members, setMembers] = React.useState<Member[]>([])
  const [copied, setCopied] = React.useState(false)
  const [isConnecting, setIsConnecting] = React.useState(false)

  // Floating reactions state & trigger
  const [reactions, setReactions] = React.useState<{ id: string; emoji: string; style: React.CSSProperties }[]>([])

  const triggerFloatingEmoji = (emoji: string) => {
    const id = generateRandomId()
    const style: React.CSSProperties = {
      position: 'absolute',
      bottom: '20px',
      left: generateRandomLeft(),
      fontSize: '2rem',
      pointerEvents: 'none',
      animation: 'floatUp 2.5s ease-out forwards',
      zIndex: 100,
    }
    setReactions(prev => [...prev, { id, emoji, style }])
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id))
    }, 2500)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = React.useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channel = React.useRef<any>(null)
  const chatEndRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll chat
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (channel.current) {
        channel.current.unsubscribe()
      }
    }
  }, [])


  const joinParty = () => {
    if (!username.trim()) {
      toast.error("Please enter a username to join!")
      return
    }

    setIsConnecting(true)
    supabase.current = createSupabaseClient()
    
    // Subscribe to room channel
    const channelName = `watch-party-${roomId}`
    channel.current = supabase.current.channel(channelName, {
      config: {
        presence: {
          key: username,
        },
      },
    })

    // Listen to broadcasts & presence
    channel.current
      .on("broadcast", { event: "chat-msg" }, (payload: { payload: PartyMessage }) => {
        setMessages(prev => [...prev, payload.payload])
      })
      .on("broadcast", { event: "media-sync" }, (payload: { payload: { mediaId: string; mediaType: "movie" | "series"; season: number; episode: number } }) => {
        const { mediaId: mId, mediaType: mType, season: s, episode: e } = payload.payload
        setRoomMediaId(mId)
        setRoomMediaType(mType)
        setSeason(s)
        setEpisode(e)
        toast.info(`Host synchronized room playback!`)
      })
      .on("broadcast", { event: "emoji-reaction" }, (payload: { payload: { emoji: string } }) => {
        triggerFloatingEmoji(payload.payload.emoji)
      })
      .on("broadcast", { event: "manual-playback-sync" }, (payload: { payload: { time: string; hostName: string } }) => {
        toast.info(`Host Playback Sync: ${payload.payload.time}`, {
          description: `${payload.payload.hostName} is at ${payload.payload.time}. Seek your player to match!`
        })
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.current.presenceState()
        const activeMembers: Member[] = []
        Object.keys(state).forEach(key => {
          const presence = state[key][0]
          activeMembers.push({
            presenceRef: key,
            username: key,
            isHost: presence.isHost || false,
          })
        })
        setMembers(activeMembers)
      })
      .on("presence", { event: "join" }, ({ key }: { key: string }) => {
        toast.success(`${key} joined the watch party!`)
      })
      .on("presence", { event: "leave" }, ({ key }: { key: string }) => {
        toast.info(`${key} left the watch party.`)
      })

    channel.current.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        // Track presence
        await channel.current.track({ isHost, joinedAt: new Date().toISOString() })
        setJoined(true)
        setIsConnecting(false)
        toast.success(`Joined room: ${roomId}`)
        
        // If host, broadcast initial details
        if (isHost) {
          sendMediaSync(roomMediaId, roomMediaType, season, episode)
        }
      } else {
        setIsConnecting(false)
      }
    })
  }

  const sendMediaSync = (mId: string, mType: "movie" | "series", s: number, e: number) => {
    if (!channel.current) return
    channel.current.send({
      type: "broadcast",
      event: "media-sync",
      payload: { mediaId: mId, mediaType: mType, season: s, episode: e }
    })
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !channel.current) return

    const msg: PartyMessage = {
      id: Math.random().toString(36).substring(2, 9),
      username,
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // Broadcast message to everyone in the room
    channel.current.send({
      type: "broadcast",
      event: "chat-msg",
      payload: msg
    })

    // Also update locally
    setMessages(prev => [...prev, msg])
    setChatInput("")
  }

  const handleCopyLink = () => {
    const inviteLink = `${window.location.origin}/watch-party/${roomId}?id=${roomMediaId}&type=${roomMediaType}&s=${season}&e=${episode}`
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    toast.success("Watch Party invite link copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleHostChangeEpisode = (offset: number) => {
    if (!isHost) return
    const nextEp = Math.max(1, episode + offset)
    setEpisode(nextEp)
    sendMediaSync(roomMediaId, roomMediaType, season, nextEp)
    // Update router query
    router.replace(`/watch-party/${roomId}?id=${roomMediaId}&type=${roomMediaType}&s=${season}&e=${nextEp}&host=true`)
  }

  const handleLeave = () => {
    if (channel.current) {
      channel.current.unsubscribe()
    }
    router.push("/")
  }

  // Pre-join input view
  if (!joined) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="bg-card border border-white/10 p-8 rounded-3xl max-w-md w-full text-center relative overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
          <Video className="w-16 h-16 text-primary mx-auto mb-6 animate-pulse" />
          <h1 className="text-3xl font-black mb-2 tracking-tight">Qverse Watch Party</h1>
          <p className="text-muted-foreground text-sm mb-6">
            {isHost ? "Setup your watch party host details" : "Join your friend's synchronized streaming session"}
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-left text-xs text-muted-foreground mb-1.5 font-bold uppercase tracking-wider">Your Nickname</label>
              <Input
                type="text"
                placeholder="Enter nickname..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                maxLength={18}
                className="bg-secondary/40 border-white/5 rounded-xl h-11 focus-visible:ring-primary"
              />
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleLeave}
                variant="outline"
                className="flex-1 rounded-xl h-11 border-white/10 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={joinParty}
                disabled={isConnecting}
                className="flex-1 rounded-xl bg-primary hover:bg-primary/95 text-xs font-bold h-11"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Party"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 min-h-[calc(100vh-4rem)] flex flex-col gap-6">
      {/* Top Banner Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-secondary/15 border border-white/5 rounded-2xl backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 border border-primary/30 rounded-xl text-primary">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-md sm:text-lg font-black tracking-tight leading-tight flex items-center gap-2">
              Party Room
              <span className="text-[10px] bg-secondary border border-white/5 px-2 py-0.5 rounded-full font-mono text-muted-foreground">
                {roomId.substring(0, 8)}...
              </span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {roomMediaType === "series" ? `Season ${season} Episode ${episode}` : "Movie Session"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopyLink}
            className="text-[10px] font-bold h-9 px-3.5 rounded-xl border border-white/5 hover:bg-secondary flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            Copy Invite
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={handleLeave}
            className="text-[10px] font-bold h-9 px-3.5 rounded-xl flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Leave Party
          </Button>
        </div>
      </div>

      {/* Grid Layout: Player Left, Chat Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start flex-1">
        {/* Player Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl overflow-hidden border border-white/5 bg-black shadow-2xl relative">
            <VideoPlayer
              imdbId={roomMediaId}
              type={roomMediaType}
              season={season}
              episode={episode}
              title={roomMediaType === "series" ? `S${season}E${episode}` : "Movie"}
            />
            {/* Floating Emojis Overlay */}
            {reactions.map(r => (
              <span key={r.id} style={r.style}>
                {r.emoji}
              </span>
            ))}
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes floatUp {
                0% {
                  transform: translateY(0) scale(0.6);
                  opacity: 0;
                }
                15% {
                  opacity: 1;
                  transform: translateY(-50px) scale(1.1);
                }
                100% {
                  transform: translateY(-300px) scale(0.8);
                  opacity: 0;
                }
              }
            ` }} />
          </div>

          {/* Host Controls */}
          {isHost && (
            <div className="p-4 bg-secondary/10 border border-white/5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs font-bold flex items-center gap-1.5 text-primary">
                <Shield className="w-3.5 h-3.5 fill-current" /> Host Panel
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const time = prompt("Enter current watch timestamp to synchronize (e.g. 14:35):")
                    if (time && time.trim() && channel.current) {
                      channel.current.send({
                        type: "broadcast",
                        event: "manual-playback-sync",
                        payload: { time: time.trim(), hostName: username }
                      })
                      toast.success("Broadcasted playback sync alert!")
                    }
                  }}
                  className="text-[10px] font-bold h-8 rounded-lg border-white/10"
                >
                  Sync Playback Time
                </Button>

                {roomMediaType === "series" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleHostChangeEpisode(-1)}
                      disabled={episode <= 1}
                      className="text-[10px] font-bold h-8 rounded-lg border-white/10"
                    >
                      Previous Episode
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleHostChangeEpisode(1)}
                      className="text-[10px] font-bold h-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Next Episode
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chat & Members Column */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-full lg:min-h-[500px]">
          {/* Members list */}
          <div className="p-4 bg-secondary/10 border border-white/5 rounded-2xl flex flex-col gap-3 shadow-lg">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" /> Active Listeners ({members.length})
            </h3>
            <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto scrollbar-thin">
              {members.map(member => (
                <div
                  key={member.presenceRef}
                  className="flex items-center gap-1.5 bg-black/30 border border-white/5 rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow-sm"
                >
                  {member.isHost && <Shield className="w-3 h-3 text-yellow-500 fill-current" />}
                  <span>{member.username}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat box */}
          <div className="flex-1 bg-secondary/15 border border-white/5 rounded-3xl flex flex-col overflow-hidden h-[450px] shadow-lg backdrop-blur-sm">
            <div className="p-3 bg-secondary/10 border-b border-white/5 text-center text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Room Chat
            </div>
            
            {/* Messages Log */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center p-6">
                  <p className="text-xs text-muted-foreground">No messages yet. Send a message to start chatting in sync!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isSelf = msg.username === username
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[9px] text-muted-foreground font-semibold px-1 mb-0.5">
                        {msg.username} · {msg.timestamp}
                      </span>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                          isSelf
                            ? "bg-primary text-primary-foreground font-medium rounded-tr-none shadow-md"
                            : "bg-secondary text-foreground rounded-tl-none border border-white/5"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Emoji Reactions Bar */}
            <div className="px-3 py-1.5 border-t border-white/5 bg-secondary/10 flex justify-around gap-1">
              {["❤️", "😂", "😭", "😱", "🔥", "👍"].map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    if (!channel.current) return
                    channel.current.send({
                      type: "broadcast",
                      event: "emoji-reaction",
                      payload: { emoji }
                    })
                    triggerFloatingEmoji(emoji)
                  }}
                  className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Input area */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-white/5 bg-secondary/20 flex items-center gap-2"
            >
              <Input
                type="text"
                placeholder="Type in room chat..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                maxLength={80}
                className="flex-1 bg-black/40 border-white/5 rounded-xl h-10 text-xs focus-visible:ring-primary"
              />
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/95 flex-shrink-0"
                disabled={!chatInput.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
