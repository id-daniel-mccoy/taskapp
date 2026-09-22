export interface CaretInfo {
  line: number
  column: number
  selected: number
  selectedWords: number
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function findMatches(haystack: string, query: string, caseSensitive: boolean, wholeWord: boolean): number[] {
  if (!query) return []
  try {
    const source = wholeWord ? `\\b${escapeRegExp(query)}\\b` : escapeRegExp(query)
    const expression = new RegExp(source, caseSensitive ? 'g' : 'gi')
    const hits: number[] = []
    let match: RegExpExecArray | null
    while ((match = expression.exec(haystack))) {
      hits.push(match.index)
      if (match[0].length === 0) expression.lastIndex += 1
    }
    return hits
  } catch {
    return []
  }
}

export function replaceAll(
  haystack: string,
  query: string,
  replacement: string,
  caseSensitive: boolean,
  wholeWord: boolean
): { next: string; count: number } {
  const hits = findMatches(haystack, query, caseSensitive, wholeWord)
  if (!hits.length) return { next: haystack, count: 0 }
  let next = ''
  let last = 0
  for (const index of hits) {
    next += haystack.slice(last, index) + replacement
    last = index + query.length
  }
  return { next: next + haystack.slice(last), count: hits.length }
}

export function caretFromText(value: string, start: number, end: number): CaretInfo {
  const pos = Math.min(start, end)
  let line = 1
  let column = 1
  for (let index = 0; index < pos; index += 1) {
    if (value[index] === '\n') {
      line += 1
      column = 1
    } else {
      column += 1
    }
  }
  const selected = Math.abs(end - start)
  const slice = value.slice(Math.min(start, end), Math.max(start, end))
  const selectedWords = slice.trim() ? slice.trim().split(/\s+/).length : 0
  return { line, column, selected, selectedWords }
}

export function offsetFromLineColumn(value: string, line: number, column = 1): number {
  const rows = value.split('\n')
  const row = Math.min(Math.max(1, Math.floor(line)), rows.length) - 1
  const col = Math.min(Math.max(1, Math.floor(column)), (rows[row]?.length ?? 0) + 1) - 1
  let offset = 0
  for (let index = 0; index < row; index += 1) offset += rows[index].length + 1
  return offset + col
}

export function parseLineColumn(value: string): { line: number; column: number } | null {
  const match = value.trim().match(/^(\d+)(?:\s*[:;,]\s*(\d+))?$/)
  if (!match) return null
  return { line: Number(match[1]), column: match[2] ? Number(match[2]) : 1 }
}
