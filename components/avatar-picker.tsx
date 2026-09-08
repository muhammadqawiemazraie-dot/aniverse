"use client"

import * as React from "react"
import { Check, User, Loader2 } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { updateUserMetadata } from "@/app/actions/user-metadata"
import { Button } from "@/components/ui/button"

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

export function AvatarPicker({ currentAvatar }: { currentAvatar?: string }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selected, setSelected] = React.useState(currentAvatar || "")
  const [saving, setSaving] = React.useState(false)

  const handleSelect = async (url: string) => {
    setSelected(url)
    setSaving(true)
    const result = await updateUserMetadata({ avatar_url: url })
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Avatar updated!")
      setIsOpen(false)
      window.location.reload() // Refresh to update navbar and profile
    }
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="mt-4 bg-white/5 border-white/10 hover:bg-white/10 text-xs font-semibold rounded-full px-4"
      >
        <User className="w-4 h-4 mr-2" />
        Change Avatar
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold tracking-tight">Choose your Avatar</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="rounded-full w-8 h-8 p-0">
                ✕
              </Button>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mb-6">
              {AVATARS.map((url, i) => (
                <button
                  key={i}
                  disabled={saving}
                  onClick={() => handleSelect(url)}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group ${
                    selected === url ? "border-primary scale-105 shadow-[0_0_20px_rgba(var(--primary),0.4)]" : "border-transparent hover:border-white/20 hover:scale-105"
                  }`}
                >
                  <Image src={url} alt={`Avatar ${i+1}`} fill className="object-cover" />
                  {selected === url && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[2px]">
                      {saving ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Check className="w-6 h-6 text-white drop-shadow-md" />}
                    </div>
                  )}
                  {selected !== url && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs font-bold text-white drop-shadow-md">Select</span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Selected avatar will appear on your profile and in comments.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
