"use client"

import { CalendarClock, Send } from "lucide-react"
import { useState } from "react"
import { Modal, inputClass } from "../kit"
import { PlatformLogo } from "./platform-logo"
import { Button } from "@/components/ui/button"
import { PLATFORMS } from "@/lib/platforms"
import type { Publication, PublishPlatform } from "@/lib/types"
import { cn } from "@/lib/utils"

type SocialPlatform = Exclude<PublishPlatform, "cms">

const ACCOUNT_FIELDS: Record<SocialPlatform, { label: string; placeholder: string; pattern: RegExp; hint: string }> = {
  linkedin: {
    label: "LinkedIn Profile URL / Account ID",
    placeholder: "https://www.linkedin.com/company/your-brand",
    pattern: /^(https?:\/\/(www\.)?linkedin\.com\/(in|company|showcase)\/[\w%-]+\/?|[\w-]{2,100})$/i,
    hint: "Enter a linkedin.com profile or company URL, or an account ID.",
  },
  x: {
    label: "X / Twitter Handle @username",
    placeholder: "@yourbrand",
    pattern: /^@?[A-Za-z0-9_]{1,15}$/,
    hint: "Use 1–15 letters, numbers or underscores, e.g. @yourbrand.",
  },
  instagram: {
    label: "Instagram Handle @username",
    placeholder: "@yourbrand",
    pattern: /^@?[A-Za-z0-9._]{1,30}$/,
    hint: "Use 1–30 letters, numbers, periods or underscores, e.g. @yourbrand.",
  },
  facebook: {
    label: "Facebook Page URL / Page ID",
    placeholder: "https://www.facebook.com/yourbrand",
    pattern: /^(https?:\/\/(www\.|m\.)?facebook\.com\/[\w.%-]+\/?|[\w.-]{2,100})$/i,
    hint: "Enter a facebook.com page URL, page username or numeric page ID.",
  },
}

function validateAccount(id: SocialPlatform, value: string) {
  const trimmed = value.trim()
  if (!trimmed) return "This account is required to publish."
  return ACCOUNT_FIELDS[id].pattern.test(trimmed) ? null : ACCOUNT_FIELDS[id].hint
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function PublishDialog({
  open,
  onClose,
  postTitle,
  initial,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  postTitle: string
  initial?: Publication
  onConfirm: (publication: Publication) => void
}) {
  const [selected, setSelected] = useState<Set<PublishPlatform>>(new Set(initial?.platforms ?? []))
  const [accounts, setAccounts] = useState<Partial<Record<PublishPlatform, string>>>(initial?.accounts ?? {})
  const [touched, setTouched] = useState<Set<PublishPlatform>>(new Set())
  const [scheduleAt, setScheduleAt] = useState(
    initial?.mode === "scheduled" ? toLocalInputValue(new Date(initial.at)) : "",
  )
  const minDate = toLocalInputValue(new Date())

  const scheduleTime = scheduleAt ? new Date(scheduleAt).getTime() : NaN
  const scheduleValid = Number.isFinite(scheduleTime) && scheduleTime > Date.now()
  const hasPlatforms = selected.size > 0
  const platforms = PLATFORMS.filter((p) => selected.has(p.id)).map((p) => p.id)
  const socialPlatforms = platforms.filter((id): id is SocialPlatform => id in ACCOUNT_FIELDS)
  const accountErrors = Object.fromEntries(
    socialPlatforms.map((id) => [id, validateAccount(id, accounts[id] ?? "")]),
  ) as Partial<Record<SocialPlatform, string | null>>
  const accountsValid = socialPlatforms.every((id) => !accountErrors[id])
  const canSubmit = hasPlatforms && accountsValid
  const selectedAccounts = Object.fromEntries(
    socialPlatforms.map((id) => [id, (accounts[id] ?? "").trim()]),
  ) as Partial<Record<PublishPlatform, string>>

  const confirm = (publication: Omit<Publication, "accounts">) => {
    if (!accountsValid) {
      setTouched(new Set(socialPlatforms))
      return
    }
    onConfirm({ ...publication, accounts: selectedAccounts })
  }

  const toggle = (id: PublishPlatform) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <Modal open={open} onClose={onClose} title="Publish / Schedule" description={`Distribute "${postTitle}" to your channels.`}>
      <div className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-xs font-medium text-muted-foreground">Target platforms</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {PLATFORMS.map((p) => {
              const checked = selected.has(p.id)
              return (
                <label
                  key={p.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border bg-background p-3 transition-colors hover:bg-muted/60 has-focus-visible:ring-3 has-focus-visible:ring-ring/20",
                    checked && "border-primary/50 bg-primary/5",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(p.id)}
                    className="size-4 shrink-0 accent-[var(--primary)]"
                  />
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-card ring-1 ring-border">
                    <PlatformLogo platform={p.id} className="size-4.5" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium">{p.label}</span>
                    <span className="truncate text-xs text-muted-foreground">{p.hint}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        {socialPlatforms.length > 0 ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-xs font-medium text-muted-foreground">Platform accounts</legend>
            {socialPlatforms.map((id) => {
              const field = ACCOUNT_FIELDS[id]
              const inputId = `publish-account-${id}`
              const errorId = `${inputId}-error`
              const error = touched.has(id) ? accountErrors[id] : null
              return (
                <div key={id} className="flex flex-col gap-1.5">
                  <label htmlFor={inputId} className="flex items-center gap-2 text-xs font-medium">
                    <PlatformLogo platform={id} className="size-3.5" />
                    {field.label}
                    <span className="text-destructive" aria-hidden>
                      *
                    </span>
                  </label>
                  <input
                    id={inputId}
                    type="text"
                    required
                    autoComplete="off"
                    spellCheck={false}
                    value={accounts[id] ?? ""}
                    placeholder={field.placeholder}
                    onChange={(e) => setAccounts((prev) => ({ ...prev, [id]: e.target.value }))}
                    onBlur={() => setTouched((prev) => new Set(prev).add(id))}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : undefined}
                    className={cn(inputClass, error && "border-destructive focus-visible:border-destructive")}
                  />
                  {error ? (
                    <p id={errorId} className="text-xs text-destructive">
                      {error}
                    </p>
                  ) : null}
                </div>
              )
            })}
          </fieldset>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="publish-schedule-at" className="text-xs font-medium text-muted-foreground">
            Schedule date & time
          </label>
          <input
            id="publish-schedule-at"
            type="datetime-local"
            value={scheduleAt}
            min={minDate}
            onChange={(e) => setScheduleAt(e.target.value)}
            className={cn(inputClass, "scheme-light dark:scheme-dark")}
          />
          {scheduleAt && !scheduleValid ? (
            <p className="text-xs text-destructive">Choose a time in the future.</p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            disabled={!canSubmit || !scheduleValid}
            onClick={() => confirm({ platforms, mode: "scheduled", at: new Date(scheduleTime).toISOString() })}
          >
            <CalendarClock data-icon="inline-start" />
            Schedule
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() => confirm({ platforms, mode: "published", at: new Date().toISOString() })}
            className="bg-emerald-600 text-white hover:bg-emerald-600/90"
          >
            <Send data-icon="inline-start" />
            Publish Immediately
          </Button>
        </div>
        {!hasPlatforms ? (
          <p className="-mt-3 text-right text-xs text-muted-foreground">Select at least one platform to continue.</p>
        ) : !accountsValid ? (
          <p className="-mt-3 text-right text-xs text-muted-foreground">
            Enter a valid account handle or ID for each selected platform to continue.
          </p>
        ) : null}
      </div>
    </Modal>
  )
}
