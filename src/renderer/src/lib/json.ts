export interface JsonCheck {
  ok: boolean
  message: string
  formatted?: string
  minified?: string
}

export function inspectJson(source: string): JsonCheck {
  const trimmed = source.trim()
  if (!trimmed) {
    return { ok: false, message: 'JSON is empty.' }
  }
  try {
    const parsed = JSON.parse(trimmed)
    return {
      ok: true,
      message: 'Valid JSON',
      formatted: JSON.stringify(parsed, null, 2) + '\n',
      minified: JSON.stringify(parsed)
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Invalid JSON'
    }
  }
}
