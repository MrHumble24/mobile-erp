import { Skeleton } from "@/shared/ui/skeleton"

export function ShopDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 border-b border-border bg-card" />
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        <Skeleton className="h-5 w-36 rounded-md" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 bg-card p-6 sm:p-8 rounded-[24px] border border-border">
          {/* Left Gallery Skeleton */}
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-[26px]" />
            <div className="flex gap-2">
              <Skeleton className="size-16 rounded-xl" />
              <Skeleton className="size-16 rounded-xl" />
              <Skeleton className="size-16 rounded-xl" />
            </div>
          </div>

          {/* Right Details Skeleton */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-9 w-3/4 rounded-lg" />
              <Skeleton className="h-8 w-40 rounded-lg" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded-md" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-14 rounded-2xl" />
                <Skeleton className="h-14 rounded-2xl" />
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-10 rounded-xl" />
            </div>

            <Skeleton className="h-13 w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

