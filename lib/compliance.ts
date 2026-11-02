import type { Guideline, Issue, IssueCategory, MediaAsset } from "./types"

const WEIGHTS = { high: 8, medium: 4 } as const
const PROFANITY_EXTRA_PENALTY = 7

/** Categories rendered as hard violations (red wavy underline) in the editor. */
export const VIOLATION_CATEGORIES: ReadonlySet<IssueCategory> = new Set([
  "Profanity",
  "Tone",
  "Terminology",
  "Unsupported Claim",
])

/** Built-in banned-language list, enforced regardless of tenant guidelines. "" means remove. */
const PROFANITY: Record<string, string> = {
  fuck: "",
  fucking: "",
  fucked: "",
  motherfucker: "",
  shit: "",
  shitty: "poor",
  bullshit: "nonsense",
  crap: "nonsense",
  crappy: "poor",
  damn: "",
  dammit: "",
  goddamn: "",
  hell: "heck",
  ass: "",
  asshole: "",
  bitch: "",
  bastard: "",
  piss: "",
  pissed: "frustrated",
  wtf: "",
  stfu: "",
}

const PROFANITY_RE = new RegExp(`\\b(?:${Object.keys(PROFANITY).sort((a, b) => b.length - a.length).join("|")})\\b`, "gi")

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

function matchCase(source: string, replacement: string) {
  if (source[0] && source[0] === source[0].toUpperCase() && source[0] !== source[0].toLowerCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1)
  }
  return replacement
}

function phraseRegex(phrase: string) {
  const escaped = escapeRegex(phrase)
  const startsWord = /^\w/.test(phrase)
  const endsWord = /\w$/.test(phrase)
  return new RegExp(`${startsWord ? "\\b" : ""}${escaped}${endsWord ? "\\b" : ""}`, "gi")
}

const TONE_REPLACEMENTS: Record<string, string> = {
  insane: "strong",
  crazy: "remarkable",
  "mind-blowing": "impressive",
  "super awesome": "excellent",
  awesome: "excellent",
  super: "highly",
  gonna: "going to",
  "act now": "explore the platform",
  hurry: "explore",
  asap: "soon",
  "don't miss out": "learn more",
  synergy: "collaboration",
  leverage: "use",
}

const CLAIM_PATTERNS: { re: RegExp; suggestion?: string }[] = [
  { re: /#1\b[^.!?\n]*/gi },
  { re: /\bthe best\b[^.!?\n]*/gi },
  { re: /\bguaranteed\b/gi, suggestion: "designed" },
  { re: /\b100%\s+\w+/gi },
  { re: /\b\d{1,3}(?:\.\d+)?%\s+(?:faster|more|better|cheaper)\b/gi },
]

function sentenceAt(text: string, index: number) {
  const before = text.lastIndexOf(".", index)
  const after = text.indexOf(".", index)
  return text.slice(before + 1, after === -1 ? text.length : after).toLowerCase()
}

function hexToRgb(hex: string) {
  const n = Number.parseInt(hex.replace("#", ""), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function colorDistance(a: string, b: string) {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

export function analyzeDraft(body: string, media: MediaAsset[], guidelines: Guideline[]) {
  const issues: Issue[] = []
  const taken: [number, number][] = []
  const overlaps = (s: number, e: number) => taken.some(([a, b]) => s < b && e > a)
  const push = (issue: Issue) => {
    if (issue.start !== undefined && issue.end !== undefined) {
      if (overlaps(issue.start, issue.end)) return
      taken.push([issue.start, issue.end])
    }
    issues.push(issue)
  }

  const facts = guidelines.filter((g) => g.category === "fact")
  const palette = guidelines.filter((g) => g.category === "visual" && g.hex)

  // Profanity first so it always wins over any overlapping match.
  for (const m of body.matchAll(PROFANITY_RE)) {
    const start = m.index ?? 0
    const replacement = PROFANITY[m[0].toLowerCase()] ?? ""
    push({
      id: `profanity-${start}`,
      category: "Profanity",
      severity: "high",
      start,
      end: start + m[0].length,
      match: m[0],
      message: `"${m[0]}" is profanity and is banned from all published brand content.`,
      ruleId: "banned-language",
      ruleTitle: "Banned Language: no profanity or offensive terms",
      suggestion: replacement ? matchCase(m[0], replacement) : "",
    })
  }

  // Unsupported claims next so they win over overlapping tone/term matches.
  for (const { re, suggestion } of CLAIM_PATTERNS) {
    for (const m of body.matchAll(re)) {
      const start = m.index ?? 0
      const sentence = sentenceAt(body, start)
      const supporting = facts.find((f) =>
        (f.keywords ?? []).some((k) => m[0].toLowerCase().includes(k.toLowerCase()) || sentence.includes(k.toLowerCase())),
      )
      if (supporting && !/#1|the best|guaranteed|100%/i.test(m[0])) continue
      push({
        id: `claim-${start}`,
        category: "Unsupported Claim",
        severity: "high",
        start,
        end: start + m[0].length,
        match: m[0],
        message: `"${m[0].trim()}" is not backed by an entry in the Fact Database. Unverified superlatives and guarantees create legal exposure.`,
        ruleId: "fact-db",
        ruleTitle: "Fact Database: claims must cite a verified source",
        suggestion: suggestion,
      })
    }
  }

  for (const g of guidelines) {
    if (g.category === "terminology" && g.preferred) {
      for (const term of g.avoid ?? []) {
        for (const m of body.matchAll(phraseRegex(term))) {
          const start = m.index ?? 0
          push({
            id: `term-${g.id}-${start}`,
            category: "Terminology",
            severity: "medium",
            start,
            end: start + m[0].length,
            match: m[0],
            message: `"${m[0]}" is a non-approved term. Use "${g.preferred}" instead.`,
            ruleId: g.id,
            ruleTitle: g.title,
            suggestion: matchCase(m[0], g.preferred),
          })
        }
      }
    }
    if (g.category === "tone") {
      for (const term of g.avoid ?? []) {
        for (const m of body.matchAll(phraseRegex(term))) {
          const start = m.index ?? 0
          const isPunct = /^!+$/.test(m[0])
          push({
            id: `tone-${g.id}-${start}`,
            category: "Tone",
            severity: "medium",
            start,
            end: start + m[0].length,
            match: m[0],
            message: isPunct
              ? "Stacked exclamation marks read as hype and conflict with the brand voice."
              : `"${m[0]}" conflicts with the brand voice guideline.`,
            ruleId: g.id,
            ruleTitle: g.title,
            suggestion: isPunct ? "." : matchCase(m[0], TONE_REPLACEMENTS[term.toLowerCase()] ?? ""),
          })
        }
      }
    }
  }

  for (const m of body.matchAll(/\bclick here\b/gi)) {
    const start = m.index ?? 0
    push({
      id: `a11y-${start}`,
      category: "Accessibility",
      severity: "medium",
      start,
      end: start + m[0].length,
      match: m[0],
      message: '"Click here" gives screen reader users no context about the link destination.',
      ruleId: "wcag-2.4.4",
      ruleTitle: "WCAG 2.4.4 — Link purpose must be clear from link text",
      suggestion: matchCase(m[0], "visit the trial page"),
    })
  }

  for (const m of body.matchAll(/#[0-9a-f]{6}\b/gi)) {
    const start = m.index ?? 0
    if (palette.some((p) => p.hex?.toLowerCase() === m[0].toLowerCase())) continue
    const nearest = palette.reduce<Guideline | undefined>(
      (best, p) => (!best || colorDistance(p.hex!, m[0]) < colorDistance(best.hex!, m[0]) ? p : best),
      undefined,
    )
    push({
      id: `hex-${start}`,
      category: "Visual Consistency",
      severity: "medium",
      start,
      end: start + m[0].length,
      match: m[0],
      message: `${m[0].toUpperCase()} is not part of the approved brand palette.`,
      ruleId: nearest?.id ?? "palette",
      ruleTitle: "Visual Rules: approved palette only",
      suggestion: nearest?.hex,
    })
  }

  for (const asset of media) {
    if (!asset.alt.trim()) {
      push({
        id: `alt-${asset.id}`,
        category: "Accessibility",
        severity: "medium",
        mediaId: asset.id,
        message: `"${asset.name}" is missing alt text. Images must be described for assistive technology.`,
        ruleId: "wcag-1.1.1",
        ruleTitle: "WCAG 1.1.1 — Non-text content requires a text alternative",
      })
    }
    if (asset.dominantHex && palette.length) {
      const nearest = palette.reduce((best, p) =>
        colorDistance(p.hex!, asset.dominantHex!) < colorDistance(best.hex!, asset.dominantHex!) ? p : best,
      )
      if (colorDistance(nearest.hex!, asset.dominantHex) > 120) {
        push({
          id: `color-${asset.id}`,
          category: "Visual Consistency",
          severity: "high",
          mediaId: asset.id,
          message: `Dominant color ${asset.dominantHex.toUpperCase()} in "${asset.name}" deviates from the brand palette. Nearest approved color is ${nearest.title} (${nearest.hex}).`,
          ruleId: nearest.id,
          ruleTitle: `Visual Rules: ${nearest.title}`,
        })
      }
    }
  }

  issues.sort((a, b) => (a.start ?? Number.MAX_SAFE_INTEGER) - (b.start ?? Number.MAX_SAFE_INTEGER))
  const penalty = issues.reduce(
    (sum, i) => sum + WEIGHTS[i.severity] + (i.category === "Profanity" ? PROFANITY_EXTRA_PENALTY : 0),
    0,
  )
  const score = Math.max(0, Math.min(100, 100 - penalty))
  return { issues, score }
}

/** Replace an issue's range with its suggestion, cleaning up doubled whitespace. */
export function applySuggestion(body: string, issue: Issue) {
  if (issue.start === undefined || issue.end === undefined || issue.suggestion === undefined) return body
  const next = body.slice(0, issue.start) + issue.suggestion + body.slice(issue.end)
  return next.replace(/ {2,}/g, " ").replace(/ ([.,!?])/g, "$1")
}
