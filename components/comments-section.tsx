"use client"

import * as React from "react"
import Link from "next/link"
import { MessageSquare, Send, Trash2, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { User } from "@supabase/supabase-js"

import { Button } from "@/components/ui/button"
import { getUser } from "@/app/actions/auth"
import { getComments, addComment, deleteComment, type Comment } from "@/app/actions/comments"

interface CommentsSectionProps {
  mediaId: string
  mediaType: "movie" | "series"
  episodeId?: string // Season/Episode id
}

export function CommentsSection({ mediaId, mediaType, episodeId }: CommentsSectionProps) {
  const [comments, setComments] = React.useState<Comment[]>([])
  const [currentUser, setCurrentUser] = React.useState<User | null>(null)
  const [newComment, setNewComment] = React.useState("")
  const [isSpoiler, setIsSpoiler] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [revealedSpoilers, setRevealedSpoilers] = React.useState<Set<string>>(new Set())

  const loadComments = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getComments(mediaId, mediaType, episodeId)
      setComments(data)
    } catch (e) {
      console.error(e)
      toast.error("Failed to load comments")
    } finally {
      setIsLoading(false)
    }
  }, [mediaId, mediaType, episodeId])

  React.useEffect(() => {
    // Get user session
    getUser().then(user => setCurrentUser(user))
    
    // Load comments
    const timer = setTimeout(() => loadComments(), 0)
    return () => clearTimeout(timer)
  }, [loadComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    const result = await addComment(mediaId, mediaType, newComment, isSpoiler, episodeId)
    setIsSubmitting(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      setNewComment("")
      setIsSpoiler(false)
      toast.success("Comment posted successfully")
      loadComments()
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    const result = await deleteComment(commentId, mediaId, mediaType, episodeId)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Comment deleted")
      loadComments()
    }
  }

  const toggleSpoiler = (id: string) => {
    setRevealedSpoilers(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    
    return date.toLocaleDateString()
  }

  return (
    <div className="bg-secondary/10 border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-sm mt-8">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold tracking-tight">Comments & Discussion</h2>
        <span className="bg-secondary px-2.5 py-0.5 rounded-full text-xs font-mono font-bold text-muted-foreground">
          {comments.length}
        </span>
      </div>

      {/* Write Comment */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="mb-8 space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
            className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Spoiler checkbox */}
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSpoiler}
                onChange={(e) => setIsSpoiler(e.target.checked)}
                className="rounded border-white/20 bg-secondary/50 text-primary focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5 text-yellow-500" />
                This comment contains spoilers
              </span>
            </label>

            <Button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="flex items-center gap-2 h-9 px-4 font-bold rounded-lg text-xs"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Post Comment
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-secondary/30 rounded-xl border border-white/5 flex items-center justify-between gap-4 mb-8">
          <p className="text-xs text-muted-foreground">
            You must be signed in to post comments.
          </p>
          <Link href="/login">
            <Button size="sm" variant="outline" className="font-bold text-xs">
              Sign In
            </Button>
          </Link>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 bg-background/20 rounded-xl border border-white/5">
          <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No comments yet. Start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const isAuthor = currentUser && currentUser.id === comment.user_id
            const emailName = comment.user_email?.split("@")[0] || "User"
            const showSpoiler = comment.is_spoiler && !revealedSpoilers.has(comment.id)

            return (
              <div 
                key={comment.id} 
                className="p-4 bg-background/20 rounded-xl border border-white/5 flex gap-4 transition-all hover:bg-background/30"
              >
                {/* Avatar Fallback */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                  {emailName.substring(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Name and time */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-xs tracking-tight text-white">{emailName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{formatRelativeTime(comment.created_at)}</span>
                      {isAuthor && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comment body */}
                  {showSpoiler ? (
                    <div 
                      onClick={() => toggleSpoiler(comment.id)}
                      className="cursor-pointer bg-black/60 border border-yellow-500/20 rounded-lg p-3 flex items-center justify-between gap-4 transition-all hover:bg-black/80"
                    >
                      <span className="text-xs text-yellow-500/90 font-medium flex items-center gap-1.5">
                        <EyeOff className="w-3.5 h-3.5" />
                        Spoiler! Click to reveal comment.
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                      {comment.is_spoiler && (
                        <button 
                          onClick={() => toggleSpoiler(comment.id)}
                          className="ml-2 text-[10px] text-yellow-500 hover:underline"
                        >
                          (Hide)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
