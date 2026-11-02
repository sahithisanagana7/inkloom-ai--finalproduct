"use client"

import { AlertTriangle, ImagePlus, X } from "lucide-react"
import { useRef, useState, type DragEvent } from "react"
import { toast } from "sonner"
import type { Issue, MediaAsset } from "@/lib/types"
import { cn } from "@/lib/utils"

async function dominantHex(url: string) {
  const img = new Image()
  img.crossOrigin = "anonymous"
  img.src = url
  await img.decode()
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 24
  const ctx = canvas.getContext("2d")
  if (!ctx) return undefined
  ctx.drawImage(img, 0, 0, 24, 24)
  const { data } = ctx.getImageData(0, 0, 24, 24)
  let r = 0
  let g = 0
  let b = 0
  const n = data.length / 4
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]
    g += data[i + 1]
    b += data[i + 2]
  }
  const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, "0")
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

export function MediaUploader({
  media,
  onChange,
  issues,
  disabled,
  onIssueClick,
}: {
  media: MediaAsset[]
  onChange: (m: MediaAsset[]) => void
  issues: Issue[]
  disabled?: boolean
  onIssueClick: (id: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const addFiles = async (files: FileList | null) => {
    if (!files || disabled) return
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"))
    if (images.length === 0) {
      toast.error("Only image files are supported.")
      return
    }
    const assets = await Promise.all(
      images.map(async (file) => {
        const url = URL.createObjectURL(file)
        return {
          id: `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          url,
          alt: "",
          dominantHex: await dominantHex(url).catch(() => undefined),
        }
      }),
    )
    onChange([...media, ...assets])
    toast.success(`${assets.length} asset${assets.length > 1 ? "s" : ""} added — running visual scan`)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Media assets</h2>
        <span className="text-xs text-muted-foreground">{media.length} attached</span>
      </div>

      {media.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.map((m) => {
            const assetIssues = issues.filter((i) => i.mediaId === m.id)
            return (
              <li key={m.id} className="group flex flex-col gap-2 overflow-hidden rounded-lg border bg-background">
                <div className="relative aspect-video bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element -- blob URLs from local uploads */}
                  <img src={m.url || "/placeholder.svg"} alt={m.alt || m.name} className="size-full object-cover" />
                  {!disabled ? (
                    <button
                      type="button"
                      onClick={() => onChange(media.filter((x) => x.id !== m.id))}
                      className="absolute top-1.5 right-1.5 rounded-md bg-background/80 p-1 text-muted-foreground backdrop-blur hover:text-foreground"
                      aria-label={`Remove ${m.name}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  ) : null}
                  {m.dominantHex ? (
                    <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 font-mono text-[10px] uppercase backdrop-blur">
                      <span className="size-2.5 rounded-sm ring-1 ring-border" style={{ backgroundColor: m.dominantHex }} />
                      {m.dominantHex}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1.5 px-2 pb-2">
                  <label className="sr-only" htmlFor={`alt-${m.id}`}>
                    Alt text for {m.name}
                  </label>
                  <input
                    id={`alt-${m.id}`}
                    value={m.alt}
                    disabled={disabled}
                    onChange={(e) => onChange(media.map((x) => (x.id === m.id ? { ...x, alt: e.target.value } : x)))}
                    placeholder="Add alt text…"
                    className="w-full rounded-md border bg-transparent px-2 py-1 text-xs outline-none focus-visible:border-ring"
                  />
                  {assetIssues.map((i) => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => onIssueClick(i.id)}
                      className="flex items-center gap-1 text-left text-[11px] font-medium text-red-600 hover:underline dark:text-red-400"
                    >
                      <AlertTriangle className="size-3 shrink-0" aria-hidden />
                      {i.category}
                    </button>
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}

      {!disabled ? (
        <>
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload media assets: drag images here or click to browse"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-5 text-center transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
            dragging ? "border-primary bg-primary/5" : "hover:border-primary/40 hover:bg-muted/40",
          )}
        >
          <ImagePlus className="size-5 text-muted-foreground" aria-hidden />
          <p className="text-xs text-muted-foreground">
            Drag images here or <span className="font-medium text-primary">browse</span>. Colors and alt text are
            checked automatically.
          </p>
        </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            aria-label="Upload media assets"
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = ""
            }}
          />
        </>
      ) : null}
    </div>
  )
}
