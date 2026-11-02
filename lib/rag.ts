import type { KnowledgeChunk } from "./help-knowledge"

const STOPWORDS = new Set(
  "a an the and or but if then of to in on for with at by from is are was were be been am do does did how what why when where which who whom can could should would i me my we our you your it its this that these those there here please tell explain about into as so not no yes".split(
    " ",
  ),
)

export function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, " ")
    .split(/[\s/-]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stem)
}

function stem(word: string) {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`
  if (word.length > 4 && word.endsWith("ing")) return word.slice(0, -3)
  if (word.length > 3 && word.endsWith("ed")) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1)
  return word
}

export type RetrievedChunk = KnowledgeChunk & { score: number }

/** BM25 ranking over title, content and keywords; titles and keywords are boosted. */
export function retrieve(query: string, chunks: KnowledgeChunk[], limit = 4): RetrievedChunk[] {
  const queryTerms = [...new Set(tokenize(query))]
  if (queryTerms.length === 0) return []

  const docs = chunks.map((c) => {
    const tokens = [
      ...tokenize(c.title),
      ...tokenize(c.title),
      ...tokenize((c.keywords ?? []).join(" ")),
      ...tokenize((c.keywords ?? []).join(" ")),
      ...tokenize(c.content),
    ]
    const tf = new Map<string, number>()
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1)
    return { chunk: c, tf, length: tokens.length }
  })

  const avgLength = docs.reduce((sum, d) => sum + d.length, 0) / Math.max(1, docs.length)
  const k1 = 1.4
  const b = 0.75

  const idf = new Map<string, number>()
  for (const term of queryTerms) {
    const df = docs.filter((d) => d.tf.has(term)).length
    idf.set(term, Math.log(1 + (docs.length - df + 0.5) / (df + 0.5)))
  }

  return docs
    .map(({ chunk, tf, length }) => {
      let score = 0
      for (const term of queryTerms) {
        const f = tf.get(term) ?? 0
        if (!f) continue
        score += idf.get(term)! * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * length) / avgLength)))
      }
      return { ...chunk, score }
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
