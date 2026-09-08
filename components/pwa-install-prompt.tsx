"use client"

import * as React from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = React.useState(false)

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      const isDismissed = localStorage.getItem("qverse-pwa-dismissed")
      if (!isDismissed) {
        setShowPrompt(true)
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("qverse-pwa-dismissed", "true")
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 max-w-md bg-card/95 backdrop-blur-md border border-primary/30 p-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/20 text-primary rounded-xl flex items-center justify-center">
          <Download className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-foreground">Install Qverse App</h4>
          <p className="text-xs text-muted-foreground">Add to Home Screen for fast, fullscreen streaming.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleInstall} className="font-semibold text-xs px-3 h-8">
          Install
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
