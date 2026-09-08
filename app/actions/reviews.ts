"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "./auth"

export interface Review {
  id: string
  created_at: string
  user_id: string
  user_email: string | null
  media_id: string
  media_type: string
  rating: number
  review_text: string
  is_spoiler: boolean
}

export async function getReviews(mediaId: string, mediaType: string): Promise<Review[]> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .match({ media_id: mediaId, media_type: mediaType })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching reviews:", error.message)
      return []
    }
    return data || []
  } catch (err) {
    console.error("Failed to fetch reviews table. Ensure SQL setup is run.", err)
    return []
  }
}

export async function addReview(
  mediaId: string,
  mediaType: string,
  rating: number,
  reviewText: string,
  isSpoiler: boolean = false
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in to submit a review." }
  }

  if (rating < 1 || rating > 10) {
    return { error: "Rating must be between 1 and 10." }
  }

  if (!reviewText.trim()) {
    return { error: "Review text cannot be empty." }
  }

  try {
    const { error } = await supabase
      .from("reviews")
      .upsert({
        user_id: user.id,
        user_email: user.email,
        media_id: mediaId,
        media_type: mediaType,
        rating,
        review_text: reviewText,
        is_spoiler: isSpoiler,
        created_at: new Date().toISOString()
      }, {
        onConflict: "user_id,media_id"
      })

    if (error) {
      if (error.code === "P0001" || error.message.includes("does not exist") || error.message.includes("relation")) {
        return { error: "Database setup required: Please run the reviews SQL migration in your Supabase SQL editor." }
      }
      return { error: error.message }
    }

    revalidatePath(`/watch/${mediaType}/${mediaId}`)

    return { success: true }
  } catch {
    return { error: "Reviews table not found. Please run the reviews SQL migration in Supabase." }
  }
}

export async function deleteReview(reviewId: string, mediaId: string, mediaType: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not logged in." }
  }

  try {
    const { error } = await supabase
      .from("reviews")
      .delete()
      .match({ id: reviewId, user_id: user.id })

    if (error) {
      return { error: error.message }
    }

    revalidatePath(`/watch/${mediaType}/${mediaId}`)

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete review"
    return { error: message }
  }
}

export async function getAverageRating(mediaId: string, mediaType: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("rating")
      .match({ media_id: mediaId, media_type: mediaType })

    if (error || !data || data.length === 0) {
      return null
    }

    const sum = data.reduce((acc, r) => acc + r.rating, 0)
    return parseFloat((sum / data.length).toFixed(1))
  } catch {
    return null
  }
}
