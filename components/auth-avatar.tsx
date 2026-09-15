"use client"

import * as React from "react"
import { User } from "lucide-react"
import Image from "next/image"
import { getActiveProfile } from "@/app/actions/profiles"

export function AuthAvatar() {
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    getActiveProfile().then(profile => {
      if (profile) {
        if (profile.avatar_url === "local_file") {
          const localAvatar = localStorage.getItem(`qverse_avatar_${profile.id}`) || localStorage.getItem(`aniverse_avatar_${profile.id}`)
          if (localAvatar) {
            setAvatarUrl(localAvatar)
            return
          }
        }
        setAvatarUrl(profile.avatar_url || "/avatars/1.jpg")
      }
    })
  }, [])

  if (avatarUrl) {
    return (
      <div className="h-8 w-8 rounded-full overflow-hidden border border-white/20">
        <Image src={avatarUrl} alt="Profile" width={32} height={32} className="object-cover w-full h-full" />
      </div>
    )
  }

  return <User className="h-5 w-5" />
}
