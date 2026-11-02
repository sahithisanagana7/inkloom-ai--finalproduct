export type DiffPart = { value: string; type: "same" | "added" | "removed" }

/** Word-level LCS diff. Tokens keep their trailing whitespace. */
export function diffWords(a: string, b: string): DiffPart[] {
  const tokenize = (s: string) => s.match(/\S+\s*|\s+/g) ?? []
  const x = tokenize(a)
  const y = tokenize(b)
  const dp: number[][] = Array.from({ length: x.length + 1 }, () => new Array(y.length + 1).fill(0))
  for (let i = x.length - 1; i >= 0; i--) {
    for (let j = y.length - 1; j >= 0; j--) {
      dp[i][j] = x[i].trim() === y[j].trim() ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const parts: DiffPart[] = []
  const push = (value: string, type: DiffPart["type"]) => {
    const last = parts[parts.length - 1]
    if (last && last.type === type) last.value += value
    else parts.push({ value, type })
  }
  let i = 0
  let j = 0
  while (i < x.length && j < y.length) {
    if (x[i].trim() === y[j].trim()) {
      push(y[j], "same")
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push(x[i++], "removed")
    } else {
      push(y[j++], "added")
    }
  }
  while (i < x.length) push(x[i++], "removed")
  while (j < y.length) push(y[j++], "added")
  return parts
}
