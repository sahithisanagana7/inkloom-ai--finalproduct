import type { UIMessage } from "ai"

export type AssistantMetadata = {
  inScope?: boolean
  sources?: { id: string; title: string; topic: string }[]
}

export type AssistantMessage = UIMessage<AssistantMetadata>
