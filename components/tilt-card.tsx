"use client"

import * as React from "react"

export function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  // Cache rect on enter so mousemove never triggers getBoundingClientRect (no layout reflow)
  const rectRef = React.useRef<DOMRect | null>(null)
  const rafRef = React.useRef<number>(0)

  const handleMouseEnter = () => {
    // Read layout once on enter, not on every pixel of movement
    rectRef.current = ref.current?.getBoundingClientRect() ?? null
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Throttle to one update per animation frame
    cancelAnimationFrame(rafRef.current)
    const clientX = e.clientX
    const clientY = e.clientY
    rafRef.current = requestAnimationFrame(() => {
      const el = ref.current
      const rect = rectRef.current
      if (!el || !rect) return
      const x = clientX - rect.left
      const y = clientY - rect.top
      const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -10
      const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 10
      el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04,1.04,1.04)`
    })
  }

  const handleMouseLeave = () => {
    cancelAnimationFrame(rafRef.current)
    if (ref.current) {
      ref.current.style.transform = "rotateX(0deg) rotateY(0deg) scale3d(1,1,1)"
    }
  }

  return (
    <div className="tilt-wrap">
      <div
        ref={ref}
        className={`tilt-inner ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    </div>
  )
}
