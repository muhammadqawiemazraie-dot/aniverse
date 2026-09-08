"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Globe } from "lucide-react"

const COUNTRIES = [
  { label: "All Countries 🌐", value: "" },
  { label: "🇯🇵 Japan (Anime & Movies)", value: "JP" },
  { label: "🇺🇸 United States (Hollywood)", value: "US" },
  { label: "🇰🇷 South Korea (K-Drama)", value: "KR" },
  { label: "🇬🇧 United Kingdom", value: "GB" },
  { label: "🇨🇳 China (Donghua & Drama)", value: "CN" },
  { label: "🇫🇷 France", value: "FR" },
  { label: "🇪🇸 Spain", value: "ES" },
  { label: "🇮🇳 India (Bollywood)", value: "IN" },
  { label: "🇩🇪 Germany", value: "DE" },
  { label: "🇮🇹 Italy", value: "IT" },
  { label: "🇨🇦 Canada", value: "CA" },
  { label: "🇦🇺 Australia", value: "AU" },
  { label: "🇲🇽 Mexico", value: "MX" },
  { label: "🇧🇷 Brazil", value: "BR" },
  { label: "🇹🇭 Thailand (Thai Drama)", value: "TH" },
  { label: "🇮🇩 Indonesia", value: "ID" },
  { label: "🇲🇾 Malaysia", value: "MY" },
  { label: "🇵🇭 Philippines (Pinoy)", value: "PH" },
  { label: "🇹🇷 Turkey (Diziler)", value: "TR" },
  { label: "🇸🇪 Sweden (Nordic)", value: "SE" },
  { label: "🇳🇴 Norway", value: "NO" },
  { label: "🇩🇰 Denmark", value: "DK" },
  { label: "🇳🇱 Netherlands", value: "NL" },
  { label: "🇵🇱 Poland", value: "PL" },
  { label: "🇷🇺 Russia", value: "RU" },
  { label: "🇮🇪 Ireland", value: "IE" },
  { label: "🇳🇿 New Zealand", value: "NZ" },
  { label: "🇪🇬 Egypt", value: "EG" },
  { label: "🇦🇷 Argentina", value: "AR" },
  { label: "🇨🇱 Chile", value: "CL" },
  { label: "🇨🇴 Colombia", value: "CO" },
]

export function CountryFilterDropdown({ currentCountry }: { currentCountry?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (val) {
      params.set("country", val)
    } else {
      params.delete("country")
    }
    params.delete("page")
    router.push(`/browse?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-full border border-white/5 bg-secondary/20">
      <span className="pl-3 text-muted-foreground font-semibold flex items-center gap-1 text-xs">
        <Globe className="w-3.5 h-3.5 text-primary" /> Country
      </span>
      <select
        value={currentCountry || ""}
        onChange={handleChange}
        className="bg-transparent text-white text-xs font-semibold px-2.5 py-1.5 focus:outline-none cursor-pointer rounded-full border-none"
      >
        {COUNTRIES.map((c) => (
          <option key={c.value} value={c.value} className="bg-slate-900 text-white">
            {c.label}
          </option>
        ))}
      </select>
    </div>
  )
}
