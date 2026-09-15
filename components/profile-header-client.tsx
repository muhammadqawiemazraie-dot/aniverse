"use client"

import * as React from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { SignOutButton } from "@/components/sign-out-button"

interface ProfileHeaderClientProps {
  activeProfileId: string
  activeName: string
  activeAvatar: string
  activeBanner: string
  userEmail: string
}

export function ProfileHeaderClient({
  activeProfileId,
  activeName,
  activeAvatar,
  activeBanner,
  userEmail
}: ProfileHeaderClientProps) {
  const [avatar, setAvatar] = React.useState(() => {
    if (activeAvatar === "local_file") return ""
    return activeAvatar
  })
  const [banner, setBanner] = React.useState(() => {
    if (activeBanner === "local_file") return ""
    return activeBanner
  })

  React.useEffect(() => {
    // If avatar is stored locally, retrieve it
    if (activeAvatar === "local_file") {
      const localAvatar = localStorage.getItem(`qverse_avatar_${activeProfileId}`) || localStorage.getItem(`aniverse_avatar_${activeProfileId}`)
      setAvatar(localAvatar || "/avatars/1.jpg")
    } else {
      setAvatar(activeAvatar)
    }

    // If banner is stored locally, retrieve it
    if (activeBanner === "local_file") {
      const localBanner = localStorage.getItem(`qverse_banner_${activeProfileId}`) || localStorage.getItem(`aniverse_banner_${activeProfileId}`)
      setBanner(localBanner || "https://cdn.myanimelist.net/images/anime/1015/138006l.jpg")
    } else {
      setBanner(activeBanner)
    }
  }, [activeAvatar, activeBanner, activeProfileId])

  return (
    <div className="relative rounded-3xl overflow-hidden bg-secondary/20 border border-white/5 mb-12 shadow-2xl">
      <div className="h-48 w-full bg-gradient-to-r from-primary/40 via-purple-500/40 to-blue-500/40 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay"
          style={{ backgroundImage: banner ? `url('${banner}')` : undefined }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
      </div>
      <div className="px-8 pb-8">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-20 relative z-10">
          <div className="flex flex-col items-center md:items-start">
            <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
              {avatar && <AvatarImage src={avatar} className="object-cover" />}
              <AvatarFallback className="text-4xl font-black bg-gradient-to-br from-primary to-purple-600 text-white">
                {activeName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 text-center md:text-left mb-2">
            <h1 className="text-3xl font-black tracking-tight">{activeName}</h1>
            <div className="flex flex-col md:flex-row md:items-center gap-2 mt-1">
              <p className="text-muted-foreground text-sm">{userEmail}</p>
              <span className="hidden md:inline text-muted-foreground/30">•</span>
              <span className="text-[11px] text-primary/80 font-medium bg-primary/10 border border-primary/15 rounded-full px-2.5 py-0.5 w-fit mx-auto md:mx-0">
                💡 Customize avatar & banner in &quot;Manage Profiles&quot; below
              </span>
            </div>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0 mb-2">
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  )
}
