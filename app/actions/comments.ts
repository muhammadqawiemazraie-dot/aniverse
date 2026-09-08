"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "./auth"

export interface Comment {
  id: string
  created_at: string
  user_id: string
  user_email: string | null
  media_id: string
  media_type: string
  episode_id: string | null
  content: string
  is_spoiler: boolean
}

export async function getComments(
  mediaId: string,
  mediaType: string,
  episodeId?: string
): Promise<Comment[]> {
  const supabase = await createClient()

  let query = supabase
    .from("comments")
    .select("*")
    .match({ media_id: mediaId, media_type: mediaType })

  if (episodeId) {
    query = query.eq("episode_id", episodeId)
  } else {
    // For series, if episodeId is not passed, only get general series comments
    // For movies, episodeId is always null/empty
    if (mediaType === "series") {
      query = query.is("episode_id", null)
    }
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching comments:", error.message)
    return []
  }

  return data || []
}

export async function addComment(
  mediaId: string,
  mediaType: string,
  content: string,
  isSpoiler: boolean = false,
  episodeId?: string
) {
  const supabase = await createClient()

  // Ensure user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in to post a comment." }
  }

  const { error } = await supabase
    .from("comments")
    .insert({
      user_id: user.id,
      user_email: user.email,
      media_id: mediaId,
      media_type: mediaType,
      content,
      is_spoiler: isSpoiler,
      episode_id: episodeId || null,
    })

  if (error) {
    return { error: error.message }
  }

  // Revalidate cache depending on media type
  revalidatePath(`/watch/${mediaType}/${mediaId}`)

  return { success: true }
}

export async function deleteComment(commentId: string, mediaId: string, mediaType: string, episodeId?: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not logged in." }
  }

  const { error } = await supabase
    .from("comments")
    .delete()
    .match({ id: commentId, user_id: user.id })

  if (error) {
    return { error: error.message }
  }

  // Revalidate cache
  revalidatePath(`/watch/${mediaType}/${mediaId}`)

  return { success: true }
}
