import Link from "next/link"
import { Tv, Home, Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
      {/* Background glow orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>404 — Lost in the Multiverse</span>
        </div>

        <h1 className="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground/80 to-foreground/20 mb-4 select-none">
          404
        </h1>

        <h2 className="text-2xl font-bold tracking-tight mb-2">Page Not Found</h2>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          The content or timeline you were looking for doesn&apos;t exist or has been shifted to another stream in Qverse.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full gap-2 shadow-lg shadow-primary/20">
            <Link href="/">
              <Home className="w-4 h-4" />
              Return to Home
            </Link>
          </Button>

          <Button asChild variant="secondary" size="lg" className="rounded-full gap-2">
            <Link href="/browse">
              <Search className="w-4 h-4" />
              Explore Catalog
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
