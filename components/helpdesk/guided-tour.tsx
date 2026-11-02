"use client"

import { ArrowLeft, ArrowRight, Check, X } from "lucide-react"
import { useEffect } from "react"
import { useApp } from "../app-provider"
import { Button } from "@/components/ui/button"
import type { Tour } from "@/lib/help-tours"

export function GuidedTour({
  tour,
  stepIndex,
  onStep,
  onExit,
}: {
  tour: Tour
  stepIndex: number
  onStep: (i: number) => void
  onExit: () => void
}) {
  const { view, setView } = useApp()
  const step = tour.steps[stepIndex]
  const last = stepIndex === tour.steps.length - 1

  useEffect(() => {
    if (view !== step.view) setView(step.view)
  }, [step.view, view, setView])

  useEffect(() => {
    const nav = document.querySelector<HTMLElement>(`[data-tour-nav="${step.view}"]`)
    nav?.setAttribute("data-tour-active", "true")
    return () => nav?.removeAttribute("data-tour-active")
  }, [step.view])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onExit()
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onExit])

  return (
    <div
      role="dialog"
      aria-label={`${tour.title} tour`}
      className="fixed right-4 bottom-20 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3 rounded-2xl border bg-popover/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-primary">
            {tour.title} · Step {stepIndex + 1} of {tour.steps.length}
          </span>
          <h2 className="text-sm font-semibold">{step.title}</h2>
        </div>
        <button
          type="button"
          onClick={onExit}
          aria-label="Exit tour"
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground text-pretty" aria-live="polite">
        {step.body}
      </p>
      <div className="flex gap-1" aria-hidden>
        {tour.steps.map((s, i) => (
          <span key={`${s.title}-${i}`} className={i <= stepIndex ? "h-1 flex-1 rounded-full bg-primary" : "h-1 flex-1 rounded-full bg-muted"} />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" disabled={stepIndex === 0} onClick={() => onStep(stepIndex - 1)}>
          <ArrowLeft data-icon="inline-start" />
          Back
        </Button>
        {last ? (
          <Button size="sm" onClick={onExit}>
            <Check data-icon="inline-start" />
            Finish
          </Button>
        ) : (
          <Button size="sm" onClick={() => onStep(stepIndex + 1)}>
            Next
            <ArrowRight data-icon="inline-end" />
          </Button>
        )}
      </div>
    </div>
  )
}
