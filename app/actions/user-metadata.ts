"use server"

import { createClient } from "./auth"

export async function updateUserMetadata(data: Record<string, unknown>) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in to sync data." }
  }

  const { error } = await supabase.auth.updateUser({
    data: { ...user.user_metadata, ...data }
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function getUserMetadata() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  return user.user_metadata
}
