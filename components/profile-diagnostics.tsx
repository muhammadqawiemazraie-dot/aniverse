"use client"

import * as React from "react"
import { ShieldAlert, ChevronDown, ChevronUp } from "lucide-react"

interface ProfileDiagnosticsProps {
  activeProfileId: string
  activeName: string
  activeAvatar: string
  activeBanner: string
  profilesList: any[]
}

export function ProfileDiagnostics({
  activeProfileId,
  activeName,
  activeAvatar,
  activeBanner,
  profilesList
}: ProfileDiagnosticsProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [localKeys, setLocalKeys] = React.useState<{ key: string; valueLength: number; snippet: string }[]>([])
  const [resolvedAvatar, setResolvedAvatar] = React.useState("")
  const [resolvedBanner, setResolvedBanner] = React.useState("")

  React.useEffect(() => {
    // Read local storage keys
    const keys: { key: string; valueLength: number; snippet: string }[] = []
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith("qverse_avatar") || key.startsWith("qverse_banner") || key.startsWith("aniverse_avatar") || key.startsWith("aniverse_banner"))) {
          const val = localStorage.getItem(key) || ""
          keys.push({
            key,
            valueLength: val.length,
            snippet: val.substring(0, 40) + (val.length > 40 ? "..." : "")
          })
        }
      }
    } catch (e) {
      console.error(e)
    }
    setLocalKeys(keys)

    // Resolve active avatar/banner
    if (activeAvatar === "local_file") {
      const local = localStorage.getItem(`qverse_avatar_${activeProfileId}`) || localStorage.getItem(`aniverse_avatar_${activeProfileId}`)
      setResolvedAvatar(local ? `Local storage (${local.length} chars)` : "Not found in local storage!")
    } else {
      setResolvedAvatar(`Server: ${activeAvatar}`)
    }

    if (activeBanner === "local_file") {
      const local = localStorage.getItem(`qverse_banner_${activeProfileId}`) || localStorage.getItem(`aniverse_banner_${activeProfileId}`)
      setResolvedBanner(local ? `Local storage (${local.length} chars)` : "Not found in local storage!")
    } else {
      setResolvedBanner(`Server: ${activeBanner}`)
    }
  }, [activeProfileId, activeAvatar, activeBanner])

  return (
    <div className="mt-12 border border-yellow-500/20 bg-yellow-500/5 rounded-2xl p-4 max-w-4xl mx-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-yellow-500/80 hover:text-yellow-500 transition-colors text-xs font-bold uppercase tracking-wider"
      >
        <span className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          Profile System Diagnostics
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4 text-xs font-mono text-muted-foreground border-t border-yellow-500/10 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <div>
            <h4 className="text-white font-bold mb-1">1. Server-side Active Profile State:</h4>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Active ID: <span className="text-yellow-400">{activeProfileId}</span></li>
              <li>Name: <span className="text-yellow-400">{activeName}</span></li>
              <li>Avatar: <span className="text-yellow-400">{activeAvatar}</span></li>
              <li>Banner: <span className="text-yellow-400">{activeBanner}</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-1">2. Local Storage Profile Cache (Browser):</h4>
            {localKeys.length === 0 ? (
              <p className="text-red-400 pl-2">No local profile files found in browser LocalStorage.</p>
            ) : (
              <table className="w-full text-left pl-2 border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-white">
                    <th className="py-1">Key</th>
                    <th className="py-1">Size</th>
                    <th className="py-1">Snippet</th>
                  </tr>
                </thead>
                <tbody>
                  {localKeys.map((item, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-1 text-yellow-400">{item.key}</td>
                      <td className="py-1">{item.valueLength} B</td>
                      <td className="py-1 text-[10px] text-muted-foreground/60">{item.snippet}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div>
            <h4 className="text-white font-bold mb-1">3. Resolved Rendering Outputs:</h4>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Resolved Avatar: <span className="text-yellow-400">{resolvedAvatar}</span></li>
              <li>Resolved Banner: <span className="text-yellow-400">{resolvedBanner}</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-1">4. Profiles Database Metadata:</h4>
            <pre className="p-2.5 bg-black/40 rounded-xl border border-white/5 overflow-x-auto text-[10px] text-yellow-400/90 leading-tight">
              {JSON.stringify(profilesList, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
