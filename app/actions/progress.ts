"use server"

import { createClient } from "./auth"
import { cookies } from "next/headers"

export interface WatchProgress {
  id: string
  updated_at: string
  user_id: string
  media_id: string
  media_type: "movie" | "series"
  title: string
  image_url: string | null
  season: number | null
  episode: number | null
  chapter_id: string | null
  chapter_number: string | null
  chapter_title: string | null
  page: number | null
  total_pages: number | null
}

export async function saveProgressDB(params: {
  mediaId: string
  mediaType: "movie" | "series"
  title: string
  imageUrl: string | null
  season?: number
  episode?: number
  chapterId?: string
  chapterNumber?: string | null
  chapterTitle?: string | null
  page?: number
  totalPages?: number
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "User is not logged in." }
  }

  const cookieStore = await cookies()
  const profileId = cookieStore.get("qverse_profile_id")?.value || cookieStore.get("aniverse_profile_id")?.value || "default"
  const scopedMediaId = `${profileId}::${params.mediaId}`

  const { error } = await supabase
    .from("watch_progress")
    .upsert({
      user_id: user.id,
      media_id: scopedMediaId,
      media_type: params.mediaType,
      title: params.title,
      image_url: params.imageUrl,
      season: params.season ?? null,
      episode: params.episode ?? null,
      chapter_id: params.chapterId ?? null,
      chapter_number: params.chapterNumber ?? null,
      chapter_title: params.chapterTitle ?? null,
      page: params.page ?? null,
      total_pages: params.totalPages ?? null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id,media_id"
    })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function getUserProgressDB(): Promise<WatchProgress[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const cookieStore = await cookies()
  const profileId = cookieStore.get("qverse_profile_id")?.value || cookieStore.get("aniverse_profile_id")?.value || "default"

  const { data, error } = await supabase
    .from("watch_progress")
    .select("*")
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("Error fetching watch progress:", error.message)
    return []
  }

  const prefix = `${profileId}::`
  return ((data || []) as WatchProgress[])
    .filter((item) => item.media_id.startsWith(prefix) || (profileId === "default" && !item.media_id.includes("::")))
    .map((item) => {
      const strippedId = item.media_id.includes("::") ? item.media_id.split("::")[1] : item.media_id
      return {
        ...item,
        media_id: strippedId
      }
    })
}

export async function getSingleProgressDB(mediaId: string): Promise<WatchProgress | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const cookieStore = await cookies()
  const profileId = cookieStore.get("qverse_profile_id")?.value || cookieStore.get("aniverse_profile_id")?.value || "default"
  const scopedMediaId = `${profileId}::${mediaId}`

  const { data, error } = await supabase
    .from("watch_progress")
    .select("*")
    .match({ user_id: user.id, media_id: scopedMediaId })
    .maybeSingle()

  if (error || !data) {
    if (profileId === "default") {
      const { data: legacyData } = await supabase
        .from("watch_progress")
        .select("*")
        .match({ user_id: user.id, media_id: mediaId })
        .maybeSingle()
      
      if (legacyData) {
        return {
          ...legacyData,
          media_id: legacyData.media_id
        }
      }
    }
    return null
  }

  // Strip prefix
  const strippedId = data.media_id.includes("::") ? data.media_id.split("::")[1] : data.media_id
  return {
    ...data,
    media_id: strippedId
  }
}

export async function deleteProgressDB(mediaId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "User is not logged in." }
  }

  const cookieStore = await cookies()
  const profileId = cookieStore.get("qverse_profile_id")?.value || cookieStore.get("aniverse_profile_id")?.value || "default"
  const scopedMediaId = `${profileId}::${mediaId}`

  const { error } = await supabase
    .from("watch_progress")
    .delete()
    .match({ user_id: user.id, media_id: scopedMediaId })

  if (profileId === "default") {
    await supabase
      .from("watch_progress")
      .delete()
      .match({ user_id: user.id, media_id: mediaId })
  }

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function clearAllProgressDB() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "User is not logged in." }
  }

  const cookieStore = await cookies()
  const profileId = cookieStore.get("qverse_profile_id")?.value || cookieStore.get("aniverse_profile_id")?.value || "default"
  const prefix = `${profileId}::`

  const { data, error: fetchError } = await supabase
    .from("watch_progress")
    .select("id, media_id, media_type")
    .eq("user_id", user.id)
    .in("media_type", ["movie", "series"])

  if (fetchError) {
    return { error: fetchError.message }
  }

  const toDeleteIds = (data || [])
    .filter(item => {
      const isScoped = item.media_id.startsWith(prefix) || (profileId === "default" && !item.media_id.includes("::"))
      return isScoped
    })
    .map(item => item.id)

  if (toDeleteIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("watch_progress")
      .delete()
      .in("id", toDeleteIds)

    if (deleteError) {
      return { error: deleteError.message }
    }
  }

  return { success: true }
}

