"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { BookOpen, Loader2, RotateCcw, SendHorizontal, Sparkles } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useApp } from "../app-provider"
import { answerLocally, type AssistantContext } from "@/lib/assistant-local"
import type { AssistantMessage } from "@/lib/assistant-types"
import { cn } from "@/lib/utils"

const SUGGESTIONS: Record<string, string[]> = {
  creator: ["How do I submit a draft for review?", "How do I publish to LinkedIn?", "What is an Unsupported Claim?"],
  manager: ["How do I request changes on a post?", "How do I import brand guidelines?", "What can Creators edit?"],
  admin: ["What does the Overview chart show?", "How do I revoke an API key?", "Who can publish approved content?"],
}

export function AssistantChat() {
  const { user, view, tenant, guidelines } = useApp()
  const [input, setInput] = useState("")
  const [transport] = useState(() => new DefaultChatTransport<AssistantMessage>({ api: "/api/assistant" }))
  const pendingRef = useRef<{ question: string; previousQuestion?: string; context: AssistantContext } | null>(null)
  const { messages, sendMessage, status, setMessages, clearError } = useChat<AssistantMessage>({
    transport,
    onError: () => {
      const pending = pendingRef.current
      clearError()
      if (!pending) return
      const { text, metadata } = answerLocally(pending.question, pending.context, pending.previousQuestion)
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        const lastText = last?.parts.map((p) => (p.type === "text" ? p.text : "")).join("").trim()
        const base = last?.role === "assistant" && !lastText ? prev.slice(0, -1) : prev
        if (last?.role === "assistant" && lastText) return prev
        return [
          ...base,
          { id: `local-${Date.now()}`, role: "assistant", metadata, parts: [{ type: "text", text }] },
        ]
      })
    },
  })
  const scrollRef = useRef<HTMLDivElement>(null)
  const busy = status === "submitted" || status === "streaming"

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, status])

  const ask = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || busy || !user) return
    clearError()
    const context: AssistantContext = {
      role: user.role,
      view,
      tenantName: tenant.name,
      guidelines: guidelines.map(({ id, category, title, description, avoid, preferred, source, hex }) => ({
        id,
        category,
        title,
        description,
        avoid,
        preferred,
        source,
        hex,
      })),
    }
    const previousUser = [...messages].reverse().find((m) => m.role === "user")
    pendingRef.current = {
      question: trimmed,
      previousQuestion: previousUser?.parts.map((p) => (p.type === "text" ? p.text : "")).join(" "),
      context,
    }
    sendMessage({ text: trimmed }, { body: { context } })
    setInput("")
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 rounded-xl bg-muted/50 p-3">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Sparkles className="size-3.5 text-primary" aria-hidden />
                Ask about Inkloom
              </span>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Answers are grounded in the Inkloom knowledge base and {tenant.name}&apos;s Brand Hub, tailored to your{" "}
                {user?.role} role.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              {(SUGGESTIONS[user?.role ?? "creator"] ?? []).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="rounded-lg border px-3 py-2 text-left text-xs transition-colors hover:bg-muted"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((m) => {
          const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("")
          const mine = m.role === "user"
          const sources = m.metadata?.inScope ? m.metadata.sources ?? [] : []
          return (
            <div key={m.id} className={cn("flex flex-col gap-1.5", mine ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap text-pretty",
                  mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted",
                )}
              >
                {text || <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Thinking" />}
              </div>
              {!mine && sources.length > 0 ? (
                <ul className="flex max-w-[90%] flex-wrap gap-1" aria-label="Sources">
                  {sources.map((s) => (
                    <li
                      key={s.id}
                      className="inline-flex items-center gap-1 rounded-md bg-card px-1.5 py-0.5 text-[11px] text-muted-foreground ring-1 ring-border"
                    >
                      <BookOpen className="size-3" aria-hidden />
                      {s.title}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )
        })}

        {status === "submitted" ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Searching the knowledge base…
          </div>
        ) : null}

      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
        className="flex items-end gap-2 border-t p-3"
      >
        {messages.length > 0 ? (
          <button
            type="button"
            onClick={() => setMessages([])}
            aria-label="Start a new conversation"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="size-4" />
          </button>
        ) : null}
        <label htmlFor="assistant-input" className="sr-only">
          Ask the onboarding assistant
        </label>
        <textarea
          id="assistant-input"
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.shiftKey) return
            if (e.nativeEvent.isComposing || e.keyCode === 229) return
            e.preventDefault()
            ask(input)
          }}
          maxLength={1000}
          placeholder="Ask about workflows, rules, permissions…"
          className="max-h-28 min-h-9 flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 focus-visible:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || busy}
          aria-label="Send question"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
        </button>
      </form>
    </div>
  )
}
