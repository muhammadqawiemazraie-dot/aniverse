"use client"

import * as React from "react"
import Image, { ImageProps } from "next/image"
import { Film } from "lucide-react"

interface SmartImageProps extends Omit<ImageProps, "onError" | "src"> {
  src?: string | null
  mediaId?: string | null
  fallbackTitle?: string
}

export function SmartImage({ src, mediaId, alt, fallbackTitle, className = "", ...props }: SmartImageProps) {
  const cleanSrc = React.useMemo(() => {
    if (!src || typeof src !== "string") return null
    if (src.includes("images.metahub.space") && src.endsWith(".jpg")) {
      return src.replace(/\.jpg$/, "")
    }
    return src
  }, [src])

  const [currentSrc, setCurrentSrc] = React.useState<string | null>(cleanSrc)
  const [retryStage, setRetryStage] = React.useState(0)

  React.useEffect(() => {
    setCurrentSrc(cleanSrc)
    setRetryStage(0)
  }, [cleanSrc])

  const handleError = () => {
    if (mediaId && mediaId.startsWith("tt")) {
      if (retryStage === 0) {
        setRetryStage(1)
        setCurrentSrc(`https://images.metahub.space/poster/small/${mediaId}/img`)
        return
      }
      if (retryStage === 1) {
        setRetryStage(2)
        setCurrentSrc(`https://images.metahub.space/poster/medium/${mediaId}/img`)
        return
      }
      if (retryStage === 2) {
        setRetryStage(3)
        setCurrentSrc(`https://live.metahub.space/poster/small/${mediaId}/img`)
        return
      }
    }
    setCurrentSrc(null)
  }

  if (!currentSrc) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-slate-900 via-purple-950/60 to-slate-950 border border-white/10 select-none ${className}`}>
        <Film className="w-8 h-8 text-purple-400/60 mb-2 animate-pulse" />
        <span className="text-xs font-bold text-slate-200 line-clamp-2 px-2 leading-tight">
          {fallbackTitle || alt || "Qverse Stream"}
        </span>
        <span className="text-[9px] font-semibold text-purple-400/70 mt-1 uppercase tracking-wider">
          Poster Unavailable
        </span>
      </div>
    )
  }

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      unoptimized
      className={className}
      onError={handleError}
    />
  )
}
