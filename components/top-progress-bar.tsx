"use client"

import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function TopProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = React.useState(0)
  const [visible, setVisible] = React.useState(false)
  const timerRef = React.useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  React.useEffect(() => {
    // start
    const startTimer = setTimeout(() => {
      setProgress(0)
      setVisible(true)
    }, 0)
    let p = 0
    timerRef.current = setInterval(() => {
      p += Math.random() * 15
      if (p > 90) { clearInterval(timerRef.current); p = 90 }
      setProgress(p)
    }, 120)

    // finish
    const finish = setTimeout(() => {
      clearInterval(timerRef.current)
      setProgress(100)
      setTimeout(() => setVisible(false), 300)
    }, 500)

    return () => {
      clearInterval(timerRef.current)
      clearTimeout(finish)
      clearTimeout(startTimer)
    }
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary shadow-[0_0_10px_rgba(var(--primary),0.8)] transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
