"use client"

import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { useApp } from "../app-provider"
import { inputClass, Modal } from "../kit"
import { Button } from "@/components/ui/button"
import type { Guideline, GuidelineCategory } from "@/lib/types"

const CATEGORY_LABEL: Record<GuidelineCategory, string> = {
  tone: "Tone & Voice",
  terminology: "Approved Terminology",
  fact: "Fact Database",
  visual: "Visual Rules",
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  )
}

export function GuidelineForm({
  initial,
  defaultCategory,
  onClose,
}: {
  initial?: Guideline
  defaultCategory: GuidelineCategory
  onClose: () => void
}) {
  const { addGuidelines, updateGuideline } = useApp()
  const [category, setCategory] = useState<GuidelineCategory>(initial?.category ?? defaultCategory)
  const [title, setTitle] = useState(initial?.title ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [avoid, setAvoid] = useState((initial?.avoid ?? []).join(", "))
  const [preferred, setPreferred] = useState(initial?.preferred ?? "")
  const [source, setSource] = useState(initial?.source ?? "")
  const [keywords, setKeywords] = useState((initial?.keywords ?? []).join(", "))
  const [hex, setHex] = useState(initial?.hex ?? "#4F46E5")

  const split = (s: string) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const g: Guideline = {
      id: initial?.id ?? `g-${Date.now().toString(36)}`,
      category,
      title: title.trim(),
      description: description.trim(),
      origin: initial?.origin,
      ...(category === "tone" && { avoid: split(avoid) }),
      ...(category === "terminology" && { avoid: split(avoid), preferred: preferred.trim() }),
      ...(category === "fact" && { source: source.trim(), keywords: split(keywords) }),
      ...(category === "visual" && { hex: hex.toUpperCase() }),
    }
    if (initial) {
      updateGuideline(g)
      toast.success("Guideline updated — inspector rules refreshed")
    } else {
      addGuidelines([g])
      toast.success("Guideline added to knowledge base")
    }
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={initial ? "Edit guideline" : "Add guideline"} description="Changes apply to the AI inspector immediately.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        {!initial ? (
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value as GuidelineCategory)} className={inputClass}>
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        <Field label="Title">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Description">
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
        </Field>
        {category === "tone" || category === "terminology" ? (
          <Field label={category === "tone" ? "Phrases to avoid" : "Non-approved terms"} hint="Comma separated">
            <input value={avoid} onChange={(e) => setAvoid(e.target.value)} className={inputClass} />
          </Field>
        ) : null}
        {category === "terminology" ? (
          <Field label="Approved term">
            <input required value={preferred} onChange={(e) => setPreferred(e.target.value)} className={inputClass} />
          </Field>
        ) : null}
        {category === "fact" ? (
          <>
            <Field label="Source citation">
              <input required value={source} onChange={(e) => setSource(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Supporting keywords" hint="Claims containing these are treated as verified, e.g. 40%">
              <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className={inputClass} />
            </Field>
          </>
        ) : null}
        {category === "visual" ? (
          <Field label="Hex color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-lg border bg-background p-1"
                aria-label="Pick color"
              />
              <input
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                pattern="^#[0-9a-fA-F]{6}$"
                className={`${inputClass} font-mono uppercase`}
              />
            </div>
          </Field>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="hover:bg-primary/90">
            {initial ? "Save changes" : "Add guideline"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
