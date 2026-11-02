import { Badge, formatTime } from "../kit"
import { PlatformLogo } from "./platform-logo"
import { platformMeta } from "@/lib/platforms"
import type { Publication } from "@/lib/types"

export function PublicationBadge({ publication }: { publication: Publication }) {
  const scheduled = publication.mode === "scheduled"
  const names = publication.platforms.map((p) => platformMeta(p).label).join(", ")
  return (
    <Badge tone={scheduled ? "primary" : "success"} className="gap-1.5 py-1 animate-in fade-in zoom-in-95">
      <span className="flex items-center -space-x-1" aria-hidden>
        {publication.platforms.map((p) => (
          <span key={p} className="flex size-5 items-center justify-center rounded-full bg-card ring-1 ring-border">
            <PlatformLogo platform={p} className="size-3" />
          </span>
        ))}
      </span>
      <span className="sr-only">{names}: </span>
      {scheduled ? `Scheduled for ${formatTime(publication.at)}` : "Published"}
    </Badge>
  )
}
