"use client"

import * as React from "react"
import Link from "next/link"
import { RefreshCw, Home, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error("Unhandled app error:", error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 relative">
      <div className="max-w-md flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-6">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Something Went Wrong</h1>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          An error occurred while loading this stream. Don&apos;t worry, your progress and settings are safe.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => reset()} size="lg" className="rounded-full gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>

          <Button asChild variant="secondary" size="lg" className="rounded-full gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              Return Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
