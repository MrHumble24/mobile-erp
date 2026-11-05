import { ImageOff } from "lucide-react"
import { apiAssetUrl } from "@/shared/api/http"
import { cn } from "@/shared/lib/utils"

export interface AssetImageProps {
  /** Server-relative asset path (`/uploads/x.png`), an absolute URL, or null. */
  path: string | null | undefined
  alt: string
  className?: string
  /** Icon size for the empty-state placeholder. */
  iconClassName?: string
}

/**
 * The single wrapped `<img>` in the app: renders an API-served asset from its
 * path, or a neutral placeholder when there is none (or it fails to load). No
 * business meaning — just "an image from our API, with a fallback".
 */
export function AssetImage({ path, alt, className, iconClassName }: AssetImageProps) {
  const src = apiAssetUrl(path)
  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-[#f4f4f5] text-[#a1a1aa]",
          className
        )}
        role="img"
        aria-label={alt}
      >
        <ImageOff className={cn("size-6", iconClassName)} />
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" className={cn("object-cover", className)} />
}
