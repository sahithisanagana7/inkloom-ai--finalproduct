import type { PublishPlatform } from "./types"

export const PLATFORMS: { id: PublishPlatform; label: string; hint: string; logo: string | null }[] = [
  { id: "linkedin", label: "LinkedIn", hint: "Company page post", logo: "/logos/linkedin.svg" },
  { id: "x", label: "X / Twitter", hint: "Post to brand account", logo: "/logos/x.svg" },
  { id: "instagram", label: "Instagram", hint: "Feed post with media", logo: "/logos/instagram.svg" },
  { id: "facebook", label: "Facebook", hint: "Page post", logo: "/logos/facebook.svg" },
  { id: "cms", label: "CMS / Blog", hint: "Publish to website blog", logo: null },
]

export function platformMeta(id: PublishPlatform) {
  return PLATFORMS.find((p) => p.id === id)!
}
