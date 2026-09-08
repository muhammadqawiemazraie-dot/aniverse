export function SkeletonCard({ aspectRatio = "3/4" }: { aspectRatio?: string }) {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div
        className="w-full rounded-xl bg-secondary/40"
        style={{ aspectRatio }}
      />
      <div className="flex flex-col gap-2">
        <div className="h-4 rounded bg-secondary/40 w-3/4" />
        <div className="h-3 rounded bg-secondary/30 w-1/2" />
      </div>
    </div>
  )
}

export function SkeletonRow({ count = 5, aspectRatio = "3/4" }: { count?: number; aspectRatio?: string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} aspectRatio={aspectRatio} />
      ))}
    </div>
  )
}

export function SkeletonHero() {
  return (
    <div className="relative h-[80vh] w-full flex items-end pb-20 animate-pulse">
      <div className="absolute inset-0 bg-secondary/20" />
      <div className="container mx-auto px-4 relative z-10 flex flex-col gap-4">
        <div className="h-6 w-32 rounded-full bg-secondary/40" />
        <div className="h-16 w-96 rounded-xl bg-secondary/40" />
        <div className="h-4 w-80 rounded bg-secondary/30" />
        <div className="h-4 w-64 rounded bg-secondary/30" />
        <div className="flex gap-4 mt-2">
          <div className="h-12 w-36 rounded-full bg-secondary/40" />
          <div className="h-12 w-28 rounded-full bg-secondary/30" />
        </div>
      </div>
    </div>
  )
}
