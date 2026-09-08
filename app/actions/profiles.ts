"use server"

import { createClient } from "./auth"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export interface Profile {
  id: string
  name: string
  avatar_url: string
  banner_url?: string
}

export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const profiles = user.user_metadata?.profiles as Profile[]
  if (!profiles || profiles.length === 0) {
    // Initialize default profile
    const emailName = user.email?.split("@")[0] || "User"
    const defaultProfile: Profile = {
      id: "default",
      name: emailName,
      avatar_url: user.user_metadata?.avatar_url || "/avatars/1.jpg",
      banner_url: "https://cdn.myanimelist.net/images/anime/1015/138006l.jpg"
    }
    // Save it to Supabase user metadata
    await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        profiles: [defaultProfile]
      }
    })
    return [defaultProfile]
  }

  return profiles
}

export async function createProfile(name: string, avatarUrl: string, bannerUrl?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not logged in." }

  const profiles = (user.user_metadata?.profiles || []) as Profile[]
  if (profiles.length >= 5) {
    return { error: "Maximum of 5 profiles allowed." }
  }

  const newProfile: Profile = {
    id: `profile_${Date.now()}`,
    name,
    avatar_url: avatarUrl,
    banner_url: bannerUrl || "https://cdn.myanimelist.net/images/anime/1015/138006l.jpg"
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      profiles: [...profiles, newProfile]
    }
  })

  if (error) return { error: error.message }
  
  revalidatePath("/", "layout")
  return { success: true, profile: newProfile }
}

export async function updateProfile(id: string, name: string, avatarUrl: string, bannerUrl?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not logged in." }

  const profiles = (user.user_metadata?.profiles || []) as Profile[]
  const updatedProfiles = profiles.map(p => {
    if (p.id === id) {
      return { ...p, name, avatar_url: avatarUrl, banner_url: bannerUrl }
    }
    return p
  })

  // Determine if this is the active profile
  const cookieStore = await cookies()
  const activeId = cookieStore.get("aniverse_profile_id")?.value || "default"

  const updateData: any = {
    ...user.user_metadata,
    profiles: updatedProfiles
  }

  // If this profile is active, also sync the main user avatar_url
  if (activeId === id) {
    updateData.avatar_url = avatarUrl
  }

  const { error } = await supabase.auth.updateUser({
    data: updateData
  })

  if (error) return { error: error.message }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function deleteProfile(id: string) {
  if (id === "default") {
    return { error: "Cannot delete the default profile." }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not logged in." }

  const profiles = (user.user_metadata?.profiles || []) as Profile[]
  const updatedProfiles = profiles.filter(p => p.id !== id)

  const { error } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      profiles: updatedProfiles
    }
  })

  if (error) return { error: error.message }

  // Clean up favorites and progress associated with this profile
  const prefix = `${id}::`
  
  // Clean up favorites
  const { data: favs } = await supabase
    .from("favorites")
    .select("media_id")

  if (favs) {
    const toDelete = favs
      .filter(f => f.media_id.startsWith(prefix))
      .map(f => f.media_id)
    if (toDelete.length > 0) {
      const { error: delError } = await supabase
        .from("favorites")
        .delete()
        .in("media_id", toDelete)
      if (delError) console.error("Error cleaning up favorites for profile:", delError.message)
    }
  }

  // Clean up progress
  const { data: prog } = await supabase
    .from("watch_progress")
    .select("media_id")

  if (prog) {
    const toDelete = prog
      .filter(p => p.media_id.startsWith(prefix))
      .map(p => p.media_id)
    if (toDelete.length > 0) {
      const { error: delError } = await supabase
        .from("watch_progress")
        .delete()
        .in("media_id", toDelete)
      if (delError) console.error("Error cleaning up progress for profile:", delError.message)
    }
  }

  // If the deleted profile was the active one, switch to default
  const cookieStore = await cookies()
  const activeId = cookieStore.get("aniverse_profile_id")?.value
  if (activeId === id) {
    cookieStore.set("aniverse_profile_id", "default", { maxAge: 60 * 60 * 24 * 365 })
  }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function getActiveProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const cookieStore = await cookies()
  const activeId = cookieStore.get("aniverse_profile_id")?.value || "default"
  
  const profiles = await getProfiles()
  const activeProfile = profiles.find(p => p.id === activeId)
  return activeProfile || profiles.find(p => p.id === "default") || null
}

export async function setActiveProfile(id: string) {
  const cookieStore = await cookies()
  cookieStore.set("aniverse_profile_id", id, { maxAge: 60 * 60 * 24 * 365 })
  
  // Update main user metadata avatar_url to match active profile
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const profiles = (user.user_metadata?.profiles || []) as Profile[]
    const active = profiles.find(p => p.id === id)
    if (active) {
      await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          avatar_url: active.avatar_url
        }
      })
    }
  }

  revalidatePath("/", "layout")
  return { success: true }
}
