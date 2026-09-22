import type { MenuCommand, ThemePreference } from './types'

export const THEMES = [
  { id: 'light', label: 'Light', scheme: 'light', window: '#f3f5f7', command: 'theme-light' },
  { id: 'dark', label: 'Dark', scheme: 'dark', window: '#0e1318', command: 'theme-dark' },
  { id: 'ocean-dream', label: 'Ocean Dream', scheme: 'light', window: '#e4f6f8', command: 'theme-ocean-dream' },
  { id: 'dark-forest', label: 'Dark Forest', scheme: 'dark', window: '#121a14', command: 'theme-dark-forest' },
  { id: 'purple-rain', label: 'Purple Rain', scheme: 'dark', window: '#16121c', command: 'theme-purple-rain' }
] as const satisfies readonly {
  id: ThemePreference
  label: string
  scheme: 'light' | 'dark'
  window: string
  command: MenuCommand
}[]

const THEME_IDS = new Set<string>(THEMES.map((item) => item.id))

export function isTheme(value: unknown): value is ThemePreference {
  return typeof value === 'string' && THEME_IDS.has(value)
}

export function normalizeTheme(value: unknown): ThemePreference {
  if (value === 'ink') return 'dark'
  if (value === 'paper') return 'light'
  if (isTheme(value)) return value
  return 'dark'
}

export function nextTheme(current: ThemePreference): ThemePreference {
  const index = THEMES.findIndex((item) => item.id === current)
  return THEMES[(index + 1) % THEMES.length].id
}

export function themeWindowColor(id: ThemePreference): string {
  return THEMES.find((item) => item.id === id)?.window ?? '#0e1318'
}

export function themeCommand(id: ThemePreference): MenuCommand {
  return THEMES.find((item) => item.id === id)?.command ?? 'theme-dark'
}

export function themeFromCommand(command: MenuCommand): ThemePreference | null {
  const match = THEMES.find((item) => item.command === command)
  return match?.id ?? null
}
