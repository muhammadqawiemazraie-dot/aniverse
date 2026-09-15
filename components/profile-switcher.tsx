"use client"

import * as React from "react"
import { Plus, Edit2, Trash2, Check, Loader2, Settings, Shield, Upload } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  getProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  setActiveProfile,
  Profile
} from "@/app/actions/profiles"
import { createClient } from "@/lib/supabase"

const AVATARS = [
  "/avatars/1.jpg",
  "/avatars/2.jpg",
  "/avatars/3.jpg",
  "/avatars/4.jpg",
  "/avatars/5.jpg",
  "/avatars/6.jpg",
  "/avatars/7.jpg",
  "/avatars/8.jpg",
  "/avatars/9.jpg",
  "/avatars/10.jpg",
  "/avatars/11.jpg",
  "/avatars/12.jpg",
]

const BANNER_PRESETS = [
  "https://cdn.myanimelist.net/images/anime/1015/138006l.jpg", // default Frieren
  "https://cdn.myanimelist.net/images/anime/1841/140656.jpg",   // Solo leveling
  "https://cdn.myanimelist.net/images/anime/1792/138022.jpg",   // JJK
  "https://cdn.myanimelist.net/images/anime/1647/140237.jpg",   // Demon slayer
]

function compressImageFile(file: File, maxWidth: number, maxHeight: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new window.Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Calculate aspect ratio resizing
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7)
          resolve(dataUrl)
        } else {
          resolve(event.target?.result as string)
        }
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

async function uploadCustomAsset(base64Data: string, profileId: string, assetType: "avatar" | "banner"): Promise<string | null> {
  try {
    const clientSupabase = createClient()
    const { data: { user } } = await clientSupabase.auth.getUser()
    if (!user) return null

    // Convert base64 to Blob
    const parts = base64Data.split(";base64,")
    const contentType = parts[0].split(":")[1]
    const raw = window.atob(parts[1])
    const rawLength = raw.length
    const uInt8Array = new Uint8Array(rawLength)
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i)
    }
    const blob = new Blob([uInt8Array], { type: contentType })

    const ext = contentType.split("/")[1] || "jpg"
    const filePath = `${user.id}/${profileId}-${assetType}-${Date.now()}.${ext}`

    // Upload to avatars bucket
    const { error: uploadError } = await clientSupabase.storage
      .from("avatars")
      .upload(filePath, blob, {
        upsert: true,
        contentType: contentType
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      toast.error(`Storage upload error: ${uploadError.message}`)
      return null
    }

    // Get public URL
    const { data: { publicUrl } } = clientSupabase.storage
      .from("avatars")
      .getPublicUrl(filePath)

    return publicUrl
  } catch (err) {
    console.error("Failed to upload custom asset:", err)
    toast.error("Failed to upload image to Supabase Storage.")
    return null
  }
}

interface ProfileSwitcherProps {
  initialProfiles: Profile[]
  activeProfile: Profile | null
}

export function ProfileSwitcher({ initialProfiles, activeProfile }: ProfileSwitcherProps) {
  const [profiles, setProfiles] = React.useState<Profile[]>(initialProfiles)
  const [active] = React.useState<Profile | null>(activeProfile)
  const [isManaging, setIsManaging] = React.useState(false)
  
  // Modals state
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [editingProfile, setEditingProfile] = React.useState<Profile | null>(null)
  
  // Form fields
  const [newName, setNewName] = React.useState("")
  const [newAvatar, setNewAvatar] = React.useState(AVATARS[0])
  const [newBanner, setNewBanner] = React.useState(BANNER_PRESETS[0])
  const [loading, setLoading] = React.useState(false)

  // Custom states
  const [avatarMode, setAvatarMode] = React.useState<'preset' | 'custom'>('preset')
  const [bannerMode, setBannerMode] = React.useState<'preset' | 'custom'>('preset')
  const [customAvatarUrl, setCustomAvatarUrl] = React.useState("")
  const [customBannerUrl, setCustomBannerUrl] = React.useState("")

  // Reload profiles helper
  const reloadProfilesList = async () => {
    const list = await getProfiles()
    setProfiles(list)
  }

  const handleSelectProfile = async (profileId: string) => {
    if (isManaging) return // Don't select if we're in manage mode
    
    setLoading(true)
    const res = await setActiveProfile(profileId)
    if (res.success) {
      // Force refresh the Supabase session on the client side to update the JWT cookie metadata!
      try {
        const clientSupabase = createClient()
        await clientSupabase.auth.refreshSession()
      } catch (err) {
        console.error("Error refreshing session:", err)
      }

      toast.success("Profile switched successfully!")
      window.location.reload()
    } else {
      toast.error("Failed to switch profile.")
      setLoading(false)
    }
  }

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) {
      toast.error("Please enter a name.")
      return
    }
    setLoading(true)

    const profileId = `profile_${Date.now()}`
    let avatarToSave = avatarMode === 'preset' ? newAvatar : customAvatarUrl
    let bannerToSave = bannerMode === 'preset' ? newBanner : customBannerUrl

    // If custom avatar is selected and is raw base64 data, upload to Supabase Storage
    if (avatarMode === 'custom' && customAvatarUrl.startsWith("data:")) {
      const publicUrl = await uploadCustomAsset(customAvatarUrl, profileId, "avatar")
      if (publicUrl) {
        avatarToSave = publicUrl
      } else {
        setLoading(false)
        return
      }
    }

    // If custom banner is selected and is raw base64 data, upload to Supabase Storage
    if (bannerMode === 'custom' && customBannerUrl.startsWith("data:")) {
      const publicUrl = await uploadCustomAsset(customBannerUrl, profileId, "banner")
      if (publicUrl) {
        bannerToSave = publicUrl
      } else {
        setLoading(false)
        return
      }
    }

    if (!avatarToSave) {
      toast.error("Please select or upload an avatar.")
      setLoading(false)
      return
    }

    const res = await createProfile(newName.trim(), avatarToSave, bannerToSave)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Profile created!")

      // Force refresh the Supabase session on the client side to update the JWT cookie metadata!
      try {
        const clientSupabase = createClient()
        await clientSupabase.auth.refreshSession()
      } catch (err) {
        console.error("Error refreshing session:", err)
      }

      setCreateOpen(false)
      setNewName("")
      await reloadProfilesList()
    }
    setLoading(false)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProfile) return
    if (!newName.trim()) {
      toast.error("Please enter a name.")
      return
    }
    setLoading(true)

    const profileId = editingProfile.id
    let avatarToSave = avatarMode === 'preset' ? newAvatar : customAvatarUrl
    let bannerToSave = bannerMode === 'preset' ? newBanner : customBannerUrl

    // If custom avatar is updated and is raw base64 data, upload to Supabase Storage
    if (avatarMode === 'custom' && customAvatarUrl.startsWith("data:")) {
      const publicUrl = await uploadCustomAsset(customAvatarUrl, profileId, "avatar")
      if (publicUrl) {
        avatarToSave = publicUrl
      } else {
        setLoading(false)
        return
      }
    }

    // If custom banner is updated and is raw base64 data, upload to Supabase Storage
    if (bannerMode === 'custom' && customBannerUrl.startsWith("data:")) {
      const publicUrl = await uploadCustomAsset(customBannerUrl, profileId, "banner")
      if (publicUrl) {
        bannerToSave = publicUrl
      } else {
        setLoading(false)
        return
      }
    }

    if (!avatarToSave) {
      toast.error("Please select or upload an avatar.")
      setLoading(false)
      return
    }

    const res = await updateProfile(profileId, newName.trim(), avatarToSave, bannerToSave)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Profile updated!")

      // Force refresh the Supabase session on the client side to update the JWT cookie metadata!
      try {
        const clientSupabase = createClient()
        await clientSupabase.auth.refreshSession()
      } catch (err) {
        console.error("Error refreshing session:", err)
      }

      setEditOpen(false)
      setEditingProfile(null)
      await reloadProfilesList()
      // If we updated the active profile, reload to update the avatar/banner in page
      if (active && active.id === editingProfile.id) {
        window.location.reload()
      }
    }
    setLoading(false)
  }

  const handleDeleteProfile = async (profileId: string) => {
    if (profileId === "default") {
      toast.error("Cannot delete the default profile.")
      return
    }
    if (!confirm("Are you sure you want to delete this profile? All its library items and progress will be permanently deleted.")) {
      return
    }
    
    setLoading(true)
    const res = await deleteProfile(profileId)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Profile deleted.")
      // Clean up localStorage
      localStorage.removeItem(`qverse_avatar_${profileId}`)
      localStorage.removeItem(`qverse_banner_${profileId}`)
      localStorage.removeItem(`aniverse_avatar_${profileId}`)
      localStorage.removeItem(`aniverse_banner_${profileId}`)

      // Force refresh the Supabase session on the client side to update the JWT cookie metadata!
      try {
        const clientSupabase = createClient()
        await clientSupabase.auth.refreshSession()
      } catch (err) {
        console.error("Error refreshing session:", err)
      }

      setEditOpen(false)
      setEditingProfile(null)
      await reloadProfilesList()
      // If we deleted the active profile, reload
      if (active && active.id === profileId) {
        window.location.reload()
      }
    }
    setLoading(false)
  }

  const openEditModal = (p: Profile) => {
    setEditingProfile(p)
    setNewName(p.name)
    setNewAvatar(p.avatar_url)
    
    if (p.avatar_url === "local_file") {
      setAvatarMode('custom')
      const local = localStorage.getItem(`qverse_avatar_${p.id}`) || localStorage.getItem(`aniverse_avatar_${p.id}`)
      setCustomAvatarUrl(local || "")
    } else {
      const isCustomAvatar = !AVATARS.includes(p.avatar_url)
      setAvatarMode(isCustomAvatar ? 'custom' : 'preset')
      setCustomAvatarUrl(isCustomAvatar ? p.avatar_url : "")
    }

    const banner = p.banner_url || BANNER_PRESETS[0]
    setNewBanner(banner)
    
    if (banner === "local_file") {
      setBannerMode('custom')
      const local = localStorage.getItem(`qverse_banner_${p.id}`) || localStorage.getItem(`aniverse_banner_${p.id}`)
      setCustomBannerUrl(local || "")
    } else {
      const isCustomBanner = !BANNER_PRESETS.includes(banner)
      setBannerMode(isCustomBanner ? 'custom' : 'preset')
      setCustomBannerUrl(isCustomBanner ? banner : "")
    }

    setEditOpen(true)
  }


  return (
    <div className="w-full bg-secondary/15 border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8 relative z-10">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Who&apos;s Watching?
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Active profile: <span className="text-primary font-bold">{active?.name}</span>
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsManaging(!isManaging)}
          className={`h-9 px-4 rounded-full border-white/10 text-xs font-semibold ${isManaging ? "bg-primary text-primary-foreground border-transparent hover:bg-primary/90" : "bg-white/5 hover:bg-white/10"}`}
        >
          {isManaging ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1.5" /> Done
            </>
          ) : (
            <>
              <Settings className="w-3.5 h-3.5 mr-1.5" /> Manage Profiles
            </>
          )}
        </Button>
      </div>

      {/* Profile Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 relative z-10">
        {profiles.map((p) => {
          const isActive = active?.id === p.id
          return (
            <div
              key={p.id}
              className="flex flex-col items-center group relative cursor-pointer"
              onClick={() => handleSelectProfile(p.id)}
            >
              {/* Profile Card Wrapper */}
              <div 
                className={`relative aspect-square w-full max-w-[120px] rounded-2xl overflow-hidden border-2 transition-all duration-300 shadow-md ${
                  isActive && !isManaging 
                    ? "border-primary scale-105 shadow-[0_0_20px_rgba(var(--primary),0.3)]" 
                    : "border-transparent group-hover:border-white/20 group-hover:scale-105"
                }`}
              >
                <Image src={p.avatar_url} alt={p.name} fill className="object-cover" />
                
                {/* Manage Mode Overlay */}
                {isManaging ? (
                  <div 
                    onClick={(e) => { e.stopPropagation(); openEditModal(p) }}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px] transition-all hover:bg-black/80"
                  >
                    <div className="p-2 bg-primary text-primary-foreground rounded-full shadow-lg">
                      <Edit2 className="w-4 h-4" />
                    </div>
                  </div>
                ) : (
                  /* Active Dot Indicator */
                  isActive && (
                    <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black animate-pulse shadow-md" title="Active Profile" />
                  )
                )}
                
                {/* Loading State Overlay */}
                {loading && !isManaging && isActive && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Name */}
              <span className={`mt-3.5 text-xs font-bold transition-all text-center max-w-[120px] truncate ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-white"}`}>
                {p.name}
              </span>
            </div>
          )
        })}

        {/* Add Profile Card */}
        {profiles.length < 5 && (
          <div 
            onClick={() => {
              setNewName("")
              setNewAvatar(AVATARS[0])
              setCreateOpen(true)
            }}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="relative aspect-square w-full max-w-[120px] rounded-2xl border-2 border-dashed border-white/10 hover:border-white/30 flex items-center justify-center transition-all group-hover:scale-105 bg-white/[0.02] hover:bg-white/[0.05]">
              <Plus className="w-8 h-8 text-muted-foreground group-hover:text-white transition-all duration-300" />
            </div>
            <span className="mt-3.5 text-xs font-bold text-muted-foreground group-hover:text-white transition-all text-center">
              Add Profile
            </span>
          </div>
        )}
      </div>

      {/* ── CREATE PROFILE DIALOG ────────────────────────────────────────── */}
      {createOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form 
            onSubmit={handleCreateProfile} 
            className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative my-auto animate-in fade-in zoom-in duration-200 max-h-[85vh] overflow-y-auto scrollbar-thin"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold tracking-tight">Create Profile</h3>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => setCreateOpen(false)} 
                className="rounded-full w-8 h-8 p-0"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-6">
              {/* Name field */}
              <div>
                <label className="block text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">Profile Name</label>
                <Input
                  type="text"
                  placeholder="Enter name..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value.substring(0, 12))}
                  required
                  maxLength={12}
                  className="bg-secondary/40 border-white/5 rounded-xl h-11 focus-visible:ring-primary text-xs"
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">Choose Avatar</label>
                <div className="flex border-b border-white/5 mb-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAvatarMode('preset')}
                    className={`px-3 py-1.5 text-xs font-bold transition-all ${avatarMode === 'preset' ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                  >
                    Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarMode('custom')}
                    className={`px-3 py-1.5 text-xs font-bold transition-all ${avatarMode === 'custom' ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                  >
                    Custom Image
                  </button>
                </div>
                
                {avatarMode === 'preset' ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-[140px] overflow-y-auto p-1.5 scrollbar-thin">
                    {AVATARS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewAvatar(url)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                          newAvatar === url ? "border-primary scale-105" : "border-transparent"
                        }`}
                      >
                        <Image src={url} alt={`Avatar ${i+1}`} fill className="object-cover" />
                        {newAvatar === url && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white drop-shadow-md" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Upload Avatar File</span>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            try {
                              const base64 = await compressImageFile(file, 400, 400)
                              setCustomAvatarUrl(base64)
                              toast.success("Avatar uploaded and compressed!")
                            } catch {
                              toast.error("Failed to compress image.")
                            }
                          }
                        }}
                        className="bg-secondary/40 border-white/5 text-xs rounded-xl h-10 py-1"
                      />
                    </div>
                    <div className="text-center text-[9px] text-muted-foreground/60 font-bold uppercase">— OR —</div>
                    <div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Avatar Image URL</span>
                      <Input
                        type="url"
                        placeholder="https://example.com/avatar.jpg"
                        value={customAvatarUrl.startsWith("data:") ? "" : customAvatarUrl}
                        onChange={(e) => setCustomAvatarUrl(e.target.value)}
                        className="bg-secondary/40 border-white/5 text-xs rounded-xl h-10"
                      />
                    </div>
                    {customAvatarUrl && (
                      <div className="mt-2 flex items-center gap-3 p-2 bg-secondary/20 rounded-xl border border-white/5">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10">
                          <img src={customAvatarUrl} alt="Preview" className="w-full h-full object-cover animate-in fade-in" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] text-green-500 font-bold uppercase tracking-wider block">Custom Avatar Selected</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Banner Selector */}
              <div>
                <label className="block text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">Choose Banner</label>
                <div className="flex border-b border-white/5 mb-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBannerMode('preset')}
                    className={`px-3 py-1.5 text-xs font-bold transition-all ${bannerMode === 'preset' ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                  >
                    Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerMode('custom')}
                    className={`px-3 py-1.5 text-xs font-bold transition-all ${bannerMode === 'custom' ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                  >
                    Custom Banner
                  </button>
                </div>

                {bannerMode === 'preset' ? (
                  <div className="grid grid-cols-2 gap-3 max-h-[140px] overflow-y-auto p-1.5 scrollbar-thin">
                    {BANNER_PRESETS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewBanner(url)}
                        className={`relative h-14 rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                          newBanner === url ? "border-primary scale-105" : "border-transparent"
                        }`}
                      >
                        <img src={url} alt={`Banner ${i+1}`} className="w-full h-full object-cover opacity-60" />
                        {newBanner === url && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow-md" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Upload Banner File</span>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            try {
                              const base64 = await compressImageFile(file, 900, 450)
                              setCustomBannerUrl(base64)
                              toast.success("Banner uploaded and compressed!")
                            } catch {
                              toast.error("Failed to compress banner.")
                            }
                          }
                        }}
                        className="bg-secondary/40 border-white/5 text-xs rounded-xl h-10 py-1"
                      />
                    </div>
                    <div className="text-center text-[9px] text-muted-foreground/60 font-bold uppercase">— OR —</div>
                    <div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Banner Image URL</span>
                      <Input
                        type="url"
                        placeholder="https://example.com/banner.jpg"
                        value={customBannerUrl.startsWith("data:") ? "" : customBannerUrl}
                        onChange={(e) => setCustomBannerUrl(e.target.value)}
                        className="bg-secondary/40 border-white/5 text-xs rounded-xl h-10"
                      />
                    </div>
                    {customBannerUrl && (
                      <div className="mt-2 flex items-center gap-3 p-2 bg-secondary/20 rounded-xl border border-white/5">
                        <div className="relative h-10 w-24 rounded-lg overflow-hidden shrink-0 border border-white/10">
                          <img src={customBannerUrl} alt="Preview" className="w-full h-full object-cover animate-in fade-in" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] text-green-500 font-bold uppercase tracking-wider block">Custom Banner Selected</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2.5 mt-8 pt-4 border-t border-white/5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                className="flex-1 rounded-xl h-11 border-white/10 font-bold text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 text-xs"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── EDIT PROFILE DIALOG ──────────────────────────────────────────── */}
      {editOpen && editingProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form 
            onSubmit={handleUpdateProfile} 
            className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative my-auto animate-in fade-in zoom-in duration-200 max-h-[85vh] overflow-y-auto scrollbar-thin"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold tracking-tight">Edit Profile</h3>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => { setEditOpen(false); setEditingProfile(null); }} 
                className="rounded-full w-8 h-8 p-0"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-6">
              {/* Name field */}
              <div>
                <label className="block text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">Profile Name</label>
                <Input
                  type="text"
                  placeholder="Enter name..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value.substring(0, 12))}
                  required
                  maxLength={12}
                  className="bg-secondary/40 border-white/5 rounded-xl h-11 focus-visible:ring-primary text-xs"
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">Choose Avatar</label>
                <div className="flex border-b border-white/5 mb-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAvatarMode('preset')}
                    className={`px-3 py-1.5 text-xs font-bold transition-all ${avatarMode === 'preset' ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                  >
                    Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarMode('custom')}
                    className={`px-3 py-1.5 text-xs font-bold transition-all ${avatarMode === 'custom' ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                  >
                    Custom Image
                  </button>
                </div>
                
                {avatarMode === 'preset' ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-[140px] overflow-y-auto p-1.5 scrollbar-thin">
                    {AVATARS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewAvatar(url)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                          newAvatar === url ? "border-primary scale-105" : "border-transparent"
                        }`}
                      >
                        <Image src={url} alt={`Avatar ${i+1}`} fill className="object-cover" />
                        {newAvatar === url && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white drop-shadow-md" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Upload Avatar File</span>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            try {
                              const base64 = await compressImageFile(file, 400, 400)
                              setCustomAvatarUrl(base64)
                              toast.success("Avatar uploaded and compressed!")
                            } catch {
                              toast.error("Failed to compress image.")
                            }
                          }
                        }}
                        className="bg-secondary/40 border-white/5 text-xs rounded-xl h-10 py-1"
                      />
                    </div>
                    <div className="text-center text-[9px] text-muted-foreground/60 font-bold uppercase">— OR —</div>
                    <div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Avatar Image URL</span>
                      <Input
                        type="url"
                        placeholder="https://example.com/avatar.jpg"
                        value={customAvatarUrl.startsWith("data:") ? "" : customAvatarUrl}
                        onChange={(e) => setCustomAvatarUrl(e.target.value)}
                        className="bg-secondary/40 border-white/5 text-xs rounded-xl h-10"
                      />
                    </div>
                    {customAvatarUrl && (
                      <div className="mt-2 flex items-center gap-3 p-2 bg-secondary/20 rounded-xl border border-white/5">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10">
                          <img src={customAvatarUrl} alt="Preview" className="w-full h-full object-cover animate-in fade-in" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] text-green-500 font-bold uppercase tracking-wider block">Custom Avatar Selected</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Banner Selector */}
              <div>
                <label className="block text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">Choose Banner</label>
                <div className="flex border-b border-white/5 mb-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBannerMode('preset')}
                    className={`px-3 py-1.5 text-xs font-bold transition-all ${bannerMode === 'preset' ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                  >
                    Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerMode('custom')}
                    className={`px-3 py-1.5 text-xs font-bold transition-all ${bannerMode === 'custom' ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                  >
                    Custom Banner
                  </button>
                </div>

                {bannerMode === 'preset' ? (
                  <div className="grid grid-cols-2 gap-3 max-h-[140px] overflow-y-auto p-1.5 scrollbar-thin">
                    {BANNER_PRESETS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewBanner(url)}
                        className={`relative h-14 rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                          newBanner === url ? "border-primary scale-105" : "border-transparent"
                        }`}
                      >
                        <img src={url} alt={`Banner ${i+1}`} className="w-full h-full object-cover opacity-60" />
                        {newBanner === url && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow-md" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Upload Banner File</span>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            try {
                              const base64 = await compressImageFile(file, 900, 450)
                              setCustomBannerUrl(base64)
                              toast.success("Banner uploaded and compressed!")
                            } catch {
                              toast.error("Failed to compress banner.")
                            }
                          }
                        }}
                        className="bg-secondary/40 border-white/5 text-xs rounded-xl h-10 py-1"
                      />
                    </div>
                    <div className="text-center text-[9px] text-muted-foreground/60 font-bold uppercase">— OR —</div>
                    <div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Banner Image URL</span>
                      <Input
                        type="url"
                        placeholder="https://example.com/banner.jpg"
                        value={customBannerUrl.startsWith("data:") ? "" : customBannerUrl}
                        onChange={(e) => setCustomBannerUrl(e.target.value)}
                        className="bg-secondary/40 border-white/5 text-xs rounded-xl h-10"
                      />
                    </div>
                    {customBannerUrl && (
                      <div className="mt-2 flex items-center gap-3 p-2 bg-secondary/20 rounded-xl border border-white/5">
                        <div className="relative h-10 w-24 rounded-lg overflow-hidden shrink-0 border border-white/10">
                          <img src={customBannerUrl} alt="Preview" className="w-full h-full object-cover animate-in fade-in" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] text-green-500 font-bold uppercase tracking-wider block">Custom Banner Selected</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 mt-8 pt-4 border-t border-white/5">
              {editingProfile.id !== "default" && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDeleteProfile(editingProfile.id)}
                  className="sm:w-1/3 rounded-xl h-11 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              )}
              <div className="flex gap-2.5 flex-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setEditOpen(false); setEditingProfile(null); }}
                  className="flex-1 rounded-xl h-11 border-white/10 font-bold text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 text-xs"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
