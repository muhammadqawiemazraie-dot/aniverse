"use client"

import * as React from "react"
import Link from "next/link"
import { Star, MessageSquare, Trash2, EyeOff, Loader2, Sparkles, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import type { User } from "@supabase/supabase-js"

import { Button } from "@/components/ui/button"
import { getUser } from "@/app/actions/auth"
import { getReviews, addReview, deleteReview, type Review } from "@/app/actions/reviews"

interface ReviewsSectionProps {
  mediaId: string
  mediaType: "movie" | "series"
  onReviewsUpdated?: () => void
}

export function ReviewsSection({ mediaId, mediaType, onReviewsUpdated }: ReviewsSectionProps) {
  const [reviews, setReviews] = React.useState<Review[]>([])
  const [currentUser, setCurrentUser] = React.useState<User | null>(null)
  const [newReviewText, setNewReviewText] = React.useState("")
  const [newRating, setNewRating] = React.useState(10)
  const [isSpoiler, setIsSpoiler] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [revealedSpoilers, setRevealedSpoilers] = React.useState<Set<string>>(new Set())
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const loadReviews = React.useCallback(async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const data = await getReviews(mediaId, mediaType)
      setReviews(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [mediaId, mediaType])

  React.useEffect(() => {
    getUser().then(user => setCurrentUser(user))
    const timer = setTimeout(() => loadReviews(), 0)
    return () => clearTimeout(timer)
  }, [loadReviews])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReviewText.trim() || isSubmitting) return

    setIsSubmitting(true)
    setErrorMsg(null)
    const result = await addReview(mediaId, mediaType, newRating, newReviewText, isSpoiler)
    setIsSubmitting(false)

    if (result?.error) {
      if (result.error.includes("Database setup")) {
        setErrorMsg(result.error)
      } else {
        toast.error(result.error)
      }
    } else {
      setNewReviewText("")
      setIsSpoiler(false)
      toast.success("Review submitted!")
      loadReviews()
      if (onReviewsUpdated) onReviewsUpdated()
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete your review?")) return

    const result = await deleteReview(reviewId, mediaId, mediaType)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Review deleted")
      loadReviews()
      if (onReviewsUpdated) onReviewsUpdated()
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

  // Calculate statistics
  const count = reviews.length
  const average = count > 0 
    ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / count).toFixed(1))
    : 0

  const ratingCounts = { positive: 0, mixed: 0, negative: 0 }
  reviews.forEach(r => {
    if (r.rating >= 8) ratingCounts.positive++
    else if (r.rating >= 5) ratingCounts.mixed++
    else ratingCounts.negative++
  })

  const stats = [
    { label: "Positive (8-10)", count: ratingCounts.positive, color: "bg-emerald-500" },
    { label: "Mixed (5-7)", count: ratingCounts.mixed, color: "bg-yellow-500" },
    { label: "Negative (1-4)", count: ratingCounts.negative, color: "bg-red-500" },
  ]

  return (
    <div className="bg-secondary/10 border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-sm mt-8">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-5 h-5 text-yellow-400" />
        <h2 className="text-xl font-bold tracking-tight">Reviews & Ratings</h2>
        <span className="bg-secondary px-2.5 py-0.5 rounded-full text-xs font-mono font-bold text-muted-foreground">
          {count}
        </span>
      </div>

      {errorMsg && (
        <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex gap-2.5 items-start">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <p className="leading-relaxed">{errorMsg}</p>
        </div>
      )}

      {/* Aggregate Stats Section */}
      {count > 0 && (
        <div className="grid sm:grid-cols-3 gap-6 p-5 rounded-2xl bg-background/30 border border-white/5 mb-8">
          <div className="flex flex-col items-center justify-center text-center border-b sm:border-b-0 sm:border-r border-white/5 pb-4 sm:pb-0">
            <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">Average Score</span>
            <div className="flex items-baseline gap-1 text-primary">
              <span className="text-4xl font-black">{average}</span>
              <span className="text-sm text-muted-foreground font-semibold">/10</span>
            </div>
            <div className="flex gap-0.5 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3.5 h-3.5 ${
                    i < Math.round(average / 2) ? "text-yellow-400 fill-current" : "text-white/20"
                  }`} 
                />
              ))}
            </div>
          </div>

          <div className="col-span-2 flex flex-col justify-center gap-3">
            {stats.map(s => {
              const pct = count > 0 ? Math.round((s.count / count) * 100) : 0
              return (
                <div key={s.label} className="text-xs">
                  <div className="flex justify-between items-center mb-1 text-muted-foreground font-medium">
                    <span>{s.label}</span>
                    <span className="font-mono text-white/80">{s.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Write / Edit Review Form */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="mb-8 space-y-4 p-5 rounded-2xl bg-secondary/10 border border-white/5">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-primary" /> Write a Review
          </h3>
          
          <div className="flex flex-col gap-3">
            {/* Rating Selector */}
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-2">
                Your Rating: <span className="text-primary font-black text-sm">{newRating} / 10</span>
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {Array.from({ length: 10 }).map((_, i) => {
                  const ratingVal = i + 1
                  const isSelected = ratingVal <= newRating
                  return (
                    <button
                      key={ratingVal}
                      type="button"
                      onClick={() => setNewRating(ratingVal)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${
                        isSelected 
                          ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/25" 
                          : "bg-background/40 border-white/10 hover:bg-secondary/40 text-muted-foreground"
                      }`}
                    >
                      {ratingVal}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Review text */}
            <textarea
              value={newReviewText}
              onChange={(e) => setNewReviewText(e.target.value)}
              placeholder="Write your review here... Share what you liked or disliked. Please keep spoilers hidden."
              rows={4}
              required
              className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all placeholder:text-muted-foreground"
            />
          </div>

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
                This review contains major spoilers
              </span>
            </label>

            <Button
              type="submit"
              disabled={!newReviewText.trim() || isSubmitting}
              className="flex items-center gap-2 h-9 px-5 font-bold rounded-lg text-xs"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Submit Review
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-secondary/20 rounded-xl border border-white/5 flex items-center justify-between gap-4 mb-8">
          <p className="text-xs text-muted-foreground">
            You must be signed in to rate and review this title.
          </p>
          <Link href="/login">
            <Button size="sm" variant="outline" className="font-bold text-xs rounded-full px-4">
              Sign In
            </Button>
          </Link>
        </div>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-background/10 rounded-xl border border-white/5">
          <Star className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No reviews yet. Be the first to rate this title!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isAuthor = currentUser && currentUser.id === review.user_id
            const emailName = review.user_email?.split("@")[0] || "User"
            const showSpoiler = review.is_spoiler && !revealedSpoilers.has(review.id)
            const relativeTime = new Date(review.created_at).toLocaleDateString(undefined, {
              year: "numeric", month: "short", day: "numeric"
            })

            return (
              <div 
                key={review.id} 
                className="p-5 bg-background/20 rounded-2xl border border-white/5 flex flex-col gap-4 hover:bg-background/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Author and score */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-black">
                      {emailName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-white block leading-tight">{emailName}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">{relativeTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Score badge */}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-black">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {review.rating}/10
                    </div>

                    {isAuthor && (
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        title="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Review Text */}
                {showSpoiler ? (
                  <div 
                    onClick={() => toggleSpoiler(review.id)}
                    className="cursor-pointer bg-black/60 border border-yellow-500/20 rounded-xl p-4 flex items-center justify-between gap-4 transition-all hover:bg-black/85"
                  >
                    <span className="text-xs text-yellow-500/90 font-bold flex items-center gap-2">
                      <EyeOff className="w-4 h-4" />
                      Warning: Review contains spoilers. Click to reveal.
                    </span>
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {review.review_text}
                    {review.is_spoiler && (
                      <button 
                        onClick={() => toggleSpoiler(review.id)}
                        className="ml-2 text-[10px] text-yellow-500 hover:underline block mt-2"
                      >
                        (Hide Spoilers)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
