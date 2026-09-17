"use client"

import * as React from "react"
import Link from "next/link"
import { MessageSquare, Send, Loader2, Trash2, X, Sparkles, Mic, MicOff, Maximize2, Minimize2, Volume2, VolumeX, Copy, Check, Dices } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import { addFavorite, getMediaPoster } from "@/app/actions/favorites"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface RecommendationCardProps {
  card: { title: string; url: string; type: "series" | "movie" }
  setIsOpen: (open: boolean) => void
}

function RecommendationCard({ card, setIsOpen }: RecommendationCardProps) {
  const router = useRouter()
  const [imageUrl, setImageUrl] = React.useState<string | null>(null)
  const [loadingImage, setLoadingImage] = React.useState(true)

  React.useEffect(() => {
    let active = true
    const loadPoster = async () => {
      const parts = card.url.split("/")
      const id = parts[parts.length - 1]
      try {
        const url = await getMediaPoster(id, card.type)
        if (active) {
          setImageUrl(url)
        }
      } catch (err) {
        console.error("Error fetching poster for card:", err)
      } finally {
        if (active) {
          setLoadingImage(false)
        }
      }
    }
    loadPoster()
    return () => { active = false }
  }, [card.url, card.type])

  return (
    <div className="flex flex-col gap-2 bg-[#111] border border-white/10 rounded-xl p-2.5 transition-all group hover:border-primary/40 shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-9 h-12 bg-secondary/80 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-sm border border-white/5 relative">
          {loadingImage ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
          ) : imageUrl ? (
            <img 
              src={imageUrl} 
              alt={card.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              loading="lazy"
            />
          ) : (
            "🎬"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-white truncate group-hover:text-primary transition-colors">{card.title}</p>
          <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider mt-1 text-white ${
            card.type === "series" ? "bg-emerald-600/80" : "bg-sky-600/80"
          }`}>
            {card.type}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-1 pt-1.5 border-t border-white/5">
        <Link 
          href={card.url}
          onClick={() => setIsOpen(false)}
          className="text-[9px] font-bold text-white bg-primary/20 hover:bg-primary/40 px-2.5 py-1 rounded-md transition-all flex items-center gap-1"
        >
          📺 Stream
        </Link>
        
        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const parts = card.url.split("/");
            const id = parts[parts.length - 1];
            try {
              const res = await addFavorite(id, card.type, card.title, imageUrl);
              if (res.error) {
                toast.error(res.error);
              } else {
                toast.success(`Added "${card.title}" to Watchlist!`);
              }
            } catch {
              toast.error("Failed to add to watchlist. Please log in.");
            }
          }}
          className="text-[9px] font-bold text-white bg-white/5 hover:bg-white/15 px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer"
        >
          ➕ Watchlist
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const parts = card.url.split("/");
            const id = parts[parts.length - 1];
            const randRoom = Math.random().toString(36).substring(2, 10);
            setIsOpen(false);
            router.push(`/watch-party/${randRoom}?id=${id}&type=${card.type}&host=true`);
          }}
          className="text-[9px] font-bold text-white bg-violet-600/30 hover:bg-violet-600/50 px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer"
        >
          👥 Watch Party
        </button>
      </div>
    </div>
  )
}

export function FloatingChat() {
  const router = useRouter()
  const pathname = usePathname()
  
  // Persistent Open State
  const [isOpen, setIsOpen] = React.useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("qbot_chat_open") === "true"
    }
    return false
  })

  // Window Expand State
  const [isExpanded, setIsExpanded] = React.useState(false)

  // Audio Speech State
  const [speakingMsgIndex, setSpeakingMsgIndex] = React.useState<number | null>(null)

  // Copied message feedback
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null)

  // Whenever isOpen changes, save to sessionStorage
  React.useEffect(() => {
    sessionStorage.setItem("qbot_chat_open", isOpen ? "true" : "false")
  }, [isOpen])

  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: "assistant",
      content: "👋 **Hi! I'm Qbot, your Qverse AI companion.**\n\nI can help you with:\n* 🔍 Find any movie, series, or anime\n* 🔥 Get personalized recommendations\n* 🎲 Pick a random movie/anime (try clicking 'Surprise Me!')\n* 📖 Plot summaries & cast info\n* 📅 Anime airing schedule\n* 🔖 View your watchlist and progress\n\nWhat are you in the mood for?"
    }
  ])
  const [inputValue, setInputValue] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const chatEndRef = React.useRef<HTMLDivElement>(null)

  // Speech and personality states
  const [personality, setPersonality] = React.useState<string>("default")
  const [isListening, setIsListening] = React.useState(false)
  const [speechSupported, setSpeechSupported] = React.useState(false)
  const recognitionRef = React.useRef<any>(null)

  // Slash commands autocomplete states
  const [showCommands, setShowCommands] = React.useState(false)
  const [selectedCommandIndex, setSelectedCommandIndex] = React.useState(0)

  const slashCommands = [
    { cmd: "/random", desc: "Pick a random movie or anime to stream" },
    { cmd: "/trending", desc: "Show trending movies & series" },
    { cmd: "/watchlist", desc: "Show my watchlist" },
    { cmd: "/history", desc: "Show my watch progress" },
    { cmd: "/schedule", desc: "Show anime airing schedule" },
    { cmd: "/help", desc: "Explain Qverse features" },
    { cmd: "/clear", desc: "Clear chat messages" }
  ]

  const filteredCommands = slashCommands.filter(c => 
    c.cmd.startsWith(inputValue.toLowerCase())
  )

  // Monitor input to show/hide slash command overlay
  React.useEffect(() => {
    if (inputValue.startsWith("/")) {
      setShowCommands(true)
      setSelectedCommandIndex(0)
    } else {
      setShowCommands(false)
    }
  }, [inputValue])

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        setSpeechSupported(true)
        const rec = new SpeechRecognition()
        rec.continuous = false
        rec.interimResults = false
        rec.lang = "en-US"

        rec.onstart = () => setIsListening(true)
        rec.onend = () => setIsListening(false)
        rec.onerror = () => setIsListening(false)
        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          if (transcript) {
            setInputValue(prev => {
              const spaced = prev ? prev + " " : ""
              return spaced + transcript
            })
          }
        }
        recognitionRef.current = rec
      }
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in this browser.")
      return
    }
    if (isListening) {
      recognitionRef.current.stop()
    } else {
      try {
        recognitionRef.current.start()
      } catch (e) {
        console.error("Speech start error:", e)
      }
    }
  }

  // Text to speech readout
  const handleSpeak = (text: string, index: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Speech synthesis is not supported in this browser.")
      return
    }

    if (speakingMsgIndex === index) {
      window.speechSynthesis.cancel()
      setSpeakingMsgIndex(null)
      return
    }

    window.speechSynthesis.cancel()
    // Strip markdown formatting for cleaner speech
    const cleanText = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_#~`]/g, "")
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.rate = 1.0
    utterance.pitch = 1.0

    utterance.onend = () => setSpeakingMsgIndex(null)
    utterance.onerror = () => setSpeakingMsgIndex(null)

    setSpeakingMsgIndex(index)
    window.speechSynthesis.speak(utterance)
  }

  // Copy message text
  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    toast.success("Message copied to clipboard!")
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Scroll to bottom on new messages
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOpen])

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: textToSend }
    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const chatHistory = [...messages, userMessage]
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatHistory,
          currentPath: pathname,
          personality
        })
      })

      if (!response.ok) throw new Error("Failed to communicate with AI helper")
      if (!response.body) throw new Error("No response stream available")

      // Add placeholder message for assistant streaming content
      setMessages(prev => [...prev, { role: "assistant", content: "" }])

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantReply = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        assistantReply += chunk
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1].content = assistantReply
          return updated
        })
      }
    } catch (e) {
      console.error(e)
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "⚠️ **Error:** I'm having trouble connecting right now. Please try searching directly using the search bar above!" }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectCommand = (cmd: string) => {
    setShowCommands(false)
    if (cmd === "/clear") {
      clearChat()
      setInputValue("")
    } else {
      handleSendMessage(cmd)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showCommands && filteredCommands.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedCommandIndex(prev => 
          (prev + 1) % filteredCommands.length
        )
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedCommandIndex(prev => 
          (prev - 1 + filteredCommands.length) % filteredCommands.length
        )
      } else if (e.key === "Enter") {
        e.preventDefault()
        handleSelectCommand(filteredCommands[selectedCommandIndex].cmd)
      } else if (e.key === "Escape") {
        e.preventDefault()
        setShowCommands(false)
      }
    }
  }

  const clearChat = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
    setSpeakingMsgIndex(null)
    setMessages([
      {
        role: "assistant",
        content: "🧹 *Chat history cleared!*\n\nHow can I help you find your next movie or series today?"
      }
    ])
  }

  const quickChips = [
    { label: "🎲 Surprise Me!", query: "/random" },
    { label: "🔥 Trending", query: "What's trending on Qverse right now?" },
    { label: "🎭 Anime Recs", query: "recommend anime series" },
    { label: "🎬 Top Movies", query: "recommend trending movies" },
    { label: "📅 Schedule", query: "show me the anime airing schedule" },
  ]

  const extractLinks = (content: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const cards: { title: string; url: string; type: "series" | "movie" }[] = []
    let match

    while ((match = linkRegex.exec(content)) !== null) {
      const [full, text, url] = match // eslint-disable-line
      let type: "series" | "movie" = "movie"
      if (url.includes("/watch/series/")) {
        type = "series"
      } else if (url.includes("/watch/movie/")) {
        type = "movie"
      } else {
        continue
      }
      
      if (!cards.some(c => c.url === url)) {
        cards.push({ title: text, url, type })
      }
    }
    return cards
  }

  // Render markdown links dynamically
  const renderMessageContent = (content: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = linkRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={lastIndex} className="whitespace-pre-wrap">{content.substring(lastIndex, match.index)}</span>)
      }
      const [full, text, url] = match // eslint-disable-line
      parts.push(
        <a 
          key={match.index} 
          href={url} 
          className="text-primary hover:underline font-bold transition-all bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20"
        >
          {text}
        </a>
      )
      lastIndex = linkRegex.lastIndex
    }

    if (lastIndex < content.length) {
      parts.push(<span key={lastIndex} className="whitespace-pre-wrap">{content.substring(lastIndex)}</span>)
    }

    return parts.length > 0 ? parts : content
  }

  return (
    <div className="fixed bottom-20 md:bottom-8 right-6 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute bottom-16 right-0 bg-card border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl transition-all duration-300 ${
              isExpanded 
                ? "w-[92vw] sm:w-[480px] h-[82vh] max-h-[700px]" 
                : "w-[340px] sm:w-[380px] h-[520px]"
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary via-purple-600 to-indigo-600 p-4 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 animate-pulse text-yellow-300 fill-current" />
                <div>
                  <h3 className="font-bold text-sm tracking-tight">Qbot Companion</h3>
                  <span className="text-[10px] text-white/80 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Active AI Helper
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <select
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  className="bg-white/15 text-white border-0 rounded-lg px-2 py-1 text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-white/30 cursor-pointer"
                  title="Choose Qbot Personality"
                >
                  <option value="default" className="text-black bg-white">🤖 Qbot</option>
                  <option value="sage" className="text-black bg-white">☯️ Sage</option>
                  <option value="critic" className="text-black bg-white">🎬 Critic</option>
                  <option value="buddy" className="text-black bg-white">🍿 Buddy</option>
                </select>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/15 rounded-lg" 
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Collapse Window" : "Expand Window"}
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/15 rounded-lg" 
                  onClick={clearChat}
                  title="Clear chat"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/15 rounded-lg" 
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Message log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div 
                    className={`group relative max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground font-medium rounded-tr-none shadow-md"
                        : "bg-secondary/40 border border-white/5 text-foreground rounded-tl-none"
                    }`}
                  >
                    {renderMessageContent(msg.content)}

                    {/* Action buttons on Assistant Messages */}
                    {msg.role === "assistant" && msg.content && (
                      <div className="flex items-center gap-1 mt-2 pt-1 border-t border-white/5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleSpeak(msg.content, i)}
                          className={`p-1 rounded hover:bg-white/10 text-[10px] flex items-center gap-1 transition-colors ${
                            speakingMsgIndex === i ? "text-primary font-bold animate-pulse" : "text-muted-foreground hover:text-white"
                          }`}
                          title="Read out loud"
                        >
                          {speakingMsgIndex === i ? <VolumeX className="w-3.5 h-3.5 text-primary" /> : <Volume2 className="w-3.5 h-3.5" />}
                          <span>{speakingMsgIndex === i ? "Stop" : "Listen"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopy(msg.content, i)}
                          className="p-1 rounded hover:bg-white/10 text-[10px] text-muted-foreground hover:text-white flex items-center gap-1 transition-colors ml-2"
                          title="Copy text"
                        >
                          {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedIndex === i ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    )}

                    {msg.role === "assistant" && (() => {
                      const cards = extractLinks(msg.content)
                      if (cards.length === 0) return null
                      return (
                        <div className="mt-3 border-t border-white/5 pt-2.5 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                            {cards.map((card, idx) => (
                              <div key={idx} className="w-[185px] flex-shrink-0 snap-start snap-always">
                                <RecommendationCard 
                                  card={card} 
                                  setIsOpen={setIsOpen} 
                                />
                              </div>
                            ))}
                          </div>
                          {cards.length > 1 && (
                            <div className="text-[8px] text-muted-foreground/60 text-right mt-1 font-semibold flex items-center justify-end gap-1 select-none">
                              Swipe for more ➔
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary/40 border border-white/5 rounded-2xl rounded-tl-none px-4 py-2.5 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span className="text-[10px] text-muted-foreground font-semibold animate-pulse">Qbot is searching & typing...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Chips selection */}
            {!isLoading && (
              <div className="px-3 py-2 flex flex-wrap gap-1.5 border-t border-white/5 bg-secondary/10">
                {quickChips.map(chip => (
                  <button
                    key={chip.label}
                    onClick={() => handleSendMessage(chip.query)}
                    className="text-[10px] bg-white/5 hover:bg-primary/20 hover:text-primary border border-white/10 rounded-full px-2.5 py-1 text-muted-foreground font-bold transition-all flex items-center gap-1"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input area */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue) }}
              className="p-3 border-t border-white/10 bg-card flex items-center gap-2 relative z-10"
            >
              {/* Autocomplete command suggestion popup overlay */}
              {showCommands && filteredCommands.length > 0 && (
                <div className="absolute bottom-[54px] left-3 right-3 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20">
                  <div className="p-1.5 space-y-0.5 max-h-[180px] overflow-y-auto scrollbar-thin">
                    {filteredCommands.map((command, idx) => (
                      <button
                        key={command.cmd}
                        type="button"
                        onClick={() => handleSelectCommand(command.cmd)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] flex items-center justify-between transition-all cursor-pointer ${
                          idx === selectedCommandIndex 
                            ? "bg-primary text-primary-foreground font-bold" 
                            : "hover:bg-white/5 text-foreground/80"
                        }`}
                      >
                        <span className="font-mono">{command.cmd}</span>
                        <span className={`text-[8px] font-medium ${idx === selectedCommandIndex ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {command.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <input
                type="text"
                placeholder="Ask Qbot or type / for commands..."
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="flex-1 bg-secondary/50 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:bg-secondary/80 transition-all disabled:opacity-50"
              />
              {speechSupported && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleListening}
                  className={`h-9 w-9 rounded-xl flex-shrink-0 transition-all ${
                    isListening 
                      ? "bg-red-500/20 text-red-500 hover:bg-red-500/35 border border-red-500/40 animate-pulse animate-duration-1000" 
                      : "bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10"
                  }`}
                  title={isListening ? "Listening... Click to stop" : "Speak to Qbot"}
                >
                  {isListening ? (
                    <Mic className="h-4.5 w-4.5" />
                  ) : (
                    <MicOff className="h-4.5 w-4.5" />
                  )}
                </Button>
              )}
              <Button 
                type="submit" 
                size="icon" 
                className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/95 flex-shrink-0"
                disabled={!inputValue.trim() || isLoading}
              >
                <Send className="h-4.5 w-4.5" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher Button */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/95 relative"
          onClick={() => setIsOpen(!isOpen)}
        >
          <MessageSquare className="h-6 w-6 text-primary-foreground" />
          <span className="sr-only">Toggle Community Chat</span>
          {!isOpen && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </span>
          )}
        </Button>
      </motion.div>
    </div>
  )
}
