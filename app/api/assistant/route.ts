import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, streamText } from "ai"
import { z } from "zod"
import { answerLocally, retrieveRelevant } from "@/lib/assistant-local"
import type { AssistantMessage } from "@/lib/assistant-types"

export const maxDuration = 30

const bodySchema = z.object({
  messages: z.array(z.any()).min(1).max(40),
  context: z.object({
    role: z.enum(["creator", "manager", "admin"]),
    view: z.string().max(40),
    tenantName: z.string().max(80),
    guidelines: z
      .array(
        z.object({
          id: z.string().max(80),
          category: z.enum(["tone", "terminology", "fact", "visual"]),
          title: z.string().max(200),
          description: z.string().max(1000),
          avoid: z.array(z.string().max(120)).max(40).optional(),
          preferred: z.string().max(120).optional(),
          source: z.string().max(300).optional(),
          hex: z.string().max(20).optional(),
        }),
      )
      .max(100),
  }),
})

function textOf(message: AssistantMessage | undefined) {
  if (!message?.parts) return ""
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join(" ")
}

const MODEL_TIMEOUT_MS = 12_000
const GATEWAY_COOLDOWN_MS = 5 * 60_000
// When the gateway rejects requests (e.g. account verification, quota), skip it for a while so answers stay instant.
let gatewayUnavailableUntil = 0

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 })

  const messages = parsed.data.messages as AssistantMessage[]
  const context = parsed.data.context
  const { role, view, tenantName } = context

  const userTurns = messages.filter((m) => m.role === "user")
  const question = textOf(userTurns[userTurns.length - 1] ?? messages[messages.length - 1]).slice(0, 1000)
  const previousQuestion = userTurns.length > 1 ? textOf(userTurns[userTurns.length - 2]) : undefined

  const relevant = retrieveRelevant(question, previousQuestion, context)
  const local = answerLocally(question, context, previousQuestion, relevant)
  const inScope = relevant.length > 0

  const contextBlock = inScope
    ? relevant.map((c, i) => `[${i + 1}] ${c.title} (${c.topic})\n${c.content}`).join("\n\n")
    : "NO MATCHING KNOWLEDGE BASE ENTRIES."

  const instructions = `You are the Inkloom AI onboarding assistant inside the Inkloom brand governance platform.
Answer the user's latest question using ONLY the retrieved knowledge base context below. Address exactly what was asked; do not dump unrelated details.

User context: role=${role}, current page=${view}, active brand=${tenantName}.
- Tailor guidance to the user's role. If the question is about something their role cannot do, say so clearly and name which role can.
- Refer to UI labels exactly as written in the context (e.g. "Submit for Review", "Publish / Schedule").
- Never invent features, settings, numbers or rules that are not in the context.
- Format: plain text, at most ~120 words. Use short paragraphs, or numbered steps ("1. ") for how-to questions. No markdown headings, bold or tables.

Out-of-scope handling:
- If the context says NO MATCHING KNOWLEDGE BASE ENTRIES, or it does not answer the question, do not answer from general knowledge. Reply briefly that you can only help with Inkloom AI governance, and suggest 2-3 example questions about Workspace, Brand Hub rules, Approvals, permissions or publishing.
- A simple greeting or thanks may be answered in one friendly sentence plus an offer of help.

Retrieved context:
${contextBlock}`

  const stream = createUIMessageStream<AssistantMessage>({
    originalMessages: messages,
    onError: () => local.text,
    execute: async ({ writer }) => {
      writer.write({ type: "start", messageMetadata: local.metadata })
      const textId = "answer"
      writer.write({ type: "text-start", id: textId })

      let streamed = ""
      if (Date.now() >= gatewayUnavailableUntil) {
        let modelError: unknown = null
        try {
          const result = streamText({
            model: "google/gemini-3.5-flash",
            instructions,
            messages: await convertToModelMessages(messages.slice(-12)),
            maxRetries: 0,
            abortSignal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
            onError: ({ error }) => {
              modelError = error
            },
          })
          for await (const delta of result.textStream) {
            streamed += delta
            writer.write({ type: "text-delta", id: textId, delta })
          }
        } catch (error) {
          modelError = error
        }
        if (modelError) {
          gatewayUnavailableUntil = Date.now() + GATEWAY_COOLDOWN_MS
          console.error("[assistant] model unavailable, using local knowledge engine:", modelError)
        }
      }

      if (!streamed.trim()) {
        writer.write({ type: "text-delta", id: textId, delta: local.text })
      }
      writer.write({ type: "text-end", id: textId })
      writer.write({ type: "finish" })
    },
  })

  return createUIMessageStreamResponse({ stream })
}
