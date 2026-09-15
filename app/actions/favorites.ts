"use server"

import { createClient } from "./auth"
import { cookies } from "next/headers"

export async function addFavorite(
  mediaId: string,
  mediaType: "movie" | "series",
  title: string,
  imageUrl: string | null,
  status: string = "plan_to_watch"
) {
  const supabase = await createClient()

  // Ensure user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in to save to library." }
  }

  const cookieStore = await cookies()
  const profileId = cookieStore.get("qverse_profile_id")?.value || cookieStore.get("aniverse_profile_id")?.value || "default"
  const scopedMediaId = `${profileId}::${mediaId}`

  // Workaround for missing UPDATE RLS policy on favorites table:
  // First delete any existing entry, then insert the new one.
  await supabase
    .from("favorites")
    .delete()
    .match({ user_id: user.id, media_id: scopedMediaId })

  const { error } = await supabase
    .from("favorites")
    .insert({
      user_id: user.id,
      media_id: scopedMediaId,
      media_type: mediaType,
      title,
      image_url: imageUrl,
      status,
    })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function removeFavorite(mediaId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not logged in." }
  }

  const cookieStore = await cookies()
  const profileId = cookieStore.get("qverse_profile_id")?.value || cookieStore.get("aniverse_profile_id")?.value || "default"
  const scopedMediaId = `${profileId}::${mediaId}`

  const { error } = await supabase
    .from("favorites")
    .delete()
    .match({ user_id: user.id, media_id: scopedMediaId })

  if (profileId === "default") {
    // Also remove the legacy one if it exists
    await supabase
      .from("favorites")
      .delete()
      .match({ user_id: user.id, media_id: mediaId })
  }

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function getUserFavorites() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const cookieStore = await cookies()
  const profileId = cookieStore.get("qverse_profile_id")?.value || cookieStore.get("aniverse_profile_id")?.value || "default"

  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching favorites:", error.message)
    return []
  }

  const prefix = `${profileId}::`
  type FavoriteRow = { id: string; user_id: string; media_id: string; media_type: string; title: string; image_url: string | null; status: string; created_at: string }
  return (data as FavoriteRow[] || [])
    .filter((item) => item.media_id.startsWith(prefix) || (profileId === "default" && !item.media_id.includes("::")))
    .map((item) => {
      const strippedId = item.media_id.includes("::") ? item.media_id.split("::")[1] : item.media_id
      return {
        ...item,
        media_id: strippedId
      }
    })
}

export async function isFavorite(mediaId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const cookieStore = await cookies()
  const profileId = cookieStore.get("qverse_profile_id")?.value || cookieStore.get("aniverse_profile_id")?.value || "default"
  const scopedMediaId = `${profileId}::${mediaId}`

  const { count } = await supabase
    .from("favorites")
    .select("*", { count: "exact", head: true })
    .match({ user_id: user.id, media_id: scopedMediaId })

  if (count && count > 0) return true

  if (profileId === "default") {
    const { count: legacyCount } = await supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .match({ user_id: user.id, media_id: mediaId })
    return (legacyCount && legacyCount > 0) ? true : false
  }

  return false
}

export async function getFavoriteStatus(mediaId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const cookieStore = await cookies()
  const profileId = cookieStore.get("qverse_profile_id")?.value || cookieStore.get("aniverse_profile_id")?.value || "default"
  const scopedMediaId = `${profileId}::${mediaId}`

  const { data, error } = await supabase
    .from("favorites")
    .select("status")
    .match({ user_id: user.id, media_id: scopedMediaId })
    .maybeSingle()

  if (error || !data) {
    if (profileId === "default") {
      const { data: legacyData } = await supabase
        .from("favorites")
        .select("status")
        .match({ user_id: user.id, media_id: mediaId })
        .maybeSingle()
      return legacyData?.status || null
    }
    return null
  }
  return data.status as string
}

export async function getPublicFavorites(targetUserId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", targetUserId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching public favorites:", error.message)
    return []
  }

  type FavoriteRow = { id: string; user_id: string; media_id: string; media_type: string; title: string; image_url: string | null; status: string; created_at: string }
  return (data as FavoriteRow[] || []).map((item) => {
    const strippedId = item.media_id.includes("::") ? item.media_id.split("::")[1] : item.media_id
    return {
      ...item,
      media_id: strippedId
    }
  })
}

export async function getMediaPoster(
  mediaId: string,
  mediaType: "movie" | "series"
): Promise<string | null> {
  try {
    const { fetchCinemetaDetails } = await import("@/lib/cinemeta")
    const details = await fetchCinemetaDetails(mediaType, mediaId)
    return details?.poster || null
  } catch (error) {
    console.error("Failed to fetch media poster in action:", error)
    return null
  }
}
