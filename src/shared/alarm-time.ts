export const WEEKDAYS = [
  { day: 1, label: 'Mon', short: 'M' },
  { day: 2, label: 'Tue', short: 'T' },
  { day: 3, label: 'Wed', short: 'W' },
  { day: 4, label: 'Thu', short: 'T' },
  { day: 5, label: 'Fri', short: 'F' },
  { day: 6, label: 'Sat', short: 'S' },
  { day: 0, label: 'Sun', short: 'S' }
] as const

const SYSTEMD_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export function uses12HourClock(): boolean {
  const cycle = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hourCycle
  return cycle === 'h12' || cycle === 'h11'
}

export function formatAlarmTime(hour: number, minute: number): string {
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date)
}

export function formatRepeat(days: number[]): string {
  if (!days.length) return 'Once'
  if (days.length === 7) return 'Every day'
  const weekdays = [1, 2, 3, 4, 5]
  const weekend = [0, 6]
  if (days.length === 5 && weekdays.every((day) => days.includes(day))) return 'Weekdays'
  if (days.length === 2 && weekend.every((day) => days.includes(day))) return 'Weekends'
  return WEEKDAYS.filter((item) => days.includes(item.day)).map((item) => item.label).join(' · ')
}

export function nextOccurrence(hour: number, minute: number, days: number[], from = new Date()): Date {
  const start = new Date(from)
  start.setSeconds(0, 0)
  for (let offset = 0; offset <= 8; offset += 1) {
    const candidate = new Date(start)
    candidate.setDate(start.getDate() + offset)
    candidate.setHours(hour, minute, 0, 0)
    if (candidate.getTime() <= from.getTime()) continue
    if (!days.length || days.includes(candidate.getDay())) return candidate
  }
  const fallback = new Date(from)
  fallback.setDate(from.getDate() + 1)
  fallback.setHours(hour, minute, 0, 0)
  return fallback
}

export function formatNextFire(when: Date, now = new Date()): string {
  const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(when)
  const startToday = new Date(now)
  startToday.setHours(0, 0, 0, 0)
  const startWhen = new Date(when)
  startWhen.setHours(0, 0, 0, 0)
  const dayDiff = Math.round((startWhen.getTime() - startToday.getTime()) / 86_400_000)
  if (dayDiff === 0) return `Today ${time}`
  if (dayDiff === 1) return `Tomorrow ${time}`
  const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(when)
  if (dayDiff < 7) return `${weekday} ${time}`
  const date = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(when)
  return `${date} ${time}`
}

export function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function toCalendar(hour: number, minute: number, days: number[], from = new Date()): string {
  const hm = `${pad2(hour)}:${pad2(minute)}:00`
  if (days.length === 7) return `*-*-* ${hm}`
  if (!days.length) {
    const next = nextOccurrence(hour, minute, days, from)
    return `${next.getFullYear()}-${pad2(next.getMonth() + 1)}-${pad2(next.getDate())} ${hm}`
  }
  const names = [...days]
    .sort((a, b) => a - b)
    .map((day) => SYSTEMD_DAYS[day])
    .join(',')
  return `${names} *-*-* ${hm}`
}
