import { Newspaper } from "lucide-react"
import { platformMeta } from "@/lib/platforms"
import type { PublishPlatform } from "@/lib/types"
import { cn } from "@/lib/utils"

export function PlatformLogo({ platform, className }: { platform: PublishPlatform; className?: string }) {
  const meta = platformMeta(platform)
  if (!meta.logo) return <Newspaper className={cn("size-4 text-primary", className)} aria-label={meta.label} />
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small static brand SVGs
    <img
      src={meta.logo || "/placeholder.svg"}
      alt={meta.label}
      width={16}
      height={16}
      className={cn("size-4 shrink-0 object-contain", platform === "x" && "dark:invert", className)}
    />
  )
}
