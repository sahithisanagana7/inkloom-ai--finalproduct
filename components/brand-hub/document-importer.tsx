"use client"

import { CheckCircle2, FileUp, Loader2 } from "lucide-react"
import { useEffect, useRef, useState, type DragEvent } from "react"
import { toast } from "sonner"
import { useApp } from "../app-provider"
import { extractedRulesFor } from "@/lib/seed"
import { cn } from "@/lib/utils"

const ACCEPTED = [".pdf", ".docx", ".txt"]
const STAGES = ["Uploading", "Extracting text", "Chunking & embedding", "Indexing rules"]

export function DocumentImporter() {
  const { addGuidelines, logEvent } = useApp()
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const [dragging, setDragging] = useState(false)
  const [job, setJob] = useState<{ name: string; progress: number } | null>(null)

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current)
  }, [])

  const ingest = (file: File) => {
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
    if (!ACCEPTED.includes(ext)) {
      toast.error("Unsupported file type. Upload a PDF, DOCX or TXT document.")
      return
    }
    if (timer.current) clearInterval(timer.current)
    setJob({ name: file.name, progress: 0 })
    let progress = 0
    timer.current = setInterval(() => {
      progress = Math.min(100, progress + 6 + Math.random() * 10)
      setJob({ name: file.name, progress })
      if (progress >= 100) {
        clearInterval(timer.current!)
        const rules = extractedRulesFor(file.name)
        addGuidelines(rules)
        logEvent("Guideline Ingestion", "gemini-2.5-pro")
        toast.success("PDF Successfully Parsed & Ingested into Vector Knowledge Base", {
          description: `${rules.length} new rules appended from ${file.name}`,
        })
        setTimeout(() => setJob(null), 1200)
      }
    }, 220)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) ingest(file)
  }

  const progress = job?.progress ?? 0
  const stage = STAGES[Math.min(STAGES.length - 1, Math.floor(progress / 25))]

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "relative flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card/50 p-6 text-center backdrop-blur transition-colors",
        dragging ? "border-primary bg-primary/5" : "hover:border-primary/40",
      )}
    >
      {job ? (
        <div className="flex w-full max-w-md flex-col gap-3" aria-live="polite">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 font-medium">
              {progress >= 100 ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-500" aria-hidden />
              ) : (
                <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-hidden />
              )}
              <span className="truncate">{job.name}</span>
            </span>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">{Math.round(progress)}%</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Ingestion progress"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{progress >= 100 ? "Complete" : stage}…</span>
        </div>
      ) : (
        <>
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            <FileUp className="size-5" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Import brand guidelines</p>
            <p className="text-xs text-muted-foreground">
              Drop a PDF, DOCX or TXT file. Gemini extracts rules into the vector knowledge base.
            </p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border bg-background px-3 py-1.5 text-sm font-medium shadow-xs transition-colors hover:bg-muted"
          >
            Browse files
          </button>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="sr-only"
        aria-label="Upload guideline document"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) ingest(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}
