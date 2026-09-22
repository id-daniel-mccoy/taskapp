import { existsSync, readdirSync, statSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { homedir } from 'node:os'
import type { AlarmSound } from '../shared/types'

const SOUND_ROOTS = [
  '/usr/share/sounds',
  '/usr/local/share/sounds'
]

const CLASSIC_TONES = [
  '/usr/share/sounds/freedesktop/stereo/alarm-clock-elapsed.oga',
  '/usr/share/sounds/freedesktop/stereo/complete.oga',
  '/usr/share/sounds/freedesktop/stereo/bell.oga',
  '/usr/share/sounds/freedesktop/stereo/phone-incoming-call.oga',
  '/usr/share/sounds/Yaru/stereo/complete.oga',
  '/usr/share/sounds/Yaru/stereo/bell.oga'
]

const EXTENSIONS = new Set(['.oga', '.ogg', '.wav', '.flac', '.mp3'])

function prettyName(filePath: string): string {
  return basename(filePath, extname(filePath))
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function dataHomeSounds(): string {
  return join(process.env.XDG_DATA_HOME || join(homedir(), '.local/share'), 'sounds')
}

function listFiles(dir: string): string[] {
  try {
    return readdirSync(dir)
  } catch {
    return []
  }
}

function isDir(path: string): boolean {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

function alarmDirs(): { theme: string; dir: string }[] {
  const found: { theme: string; dir: string }[] = []
  const seen = new Set<string>()

  const add = (theme: string, dir: string) => {
    if (!isDir(dir) || seen.has(dir)) return
    seen.add(dir)
    found.push({ theme, dir })
  }

  for (const root of [...SOUND_ROOTS, dataHomeSounds()]) {
    if (!isDir(root)) continue
    add('GNOME', join(root, 'gnome/default/alarms'))
    for (const theme of listFiles(root)) {
      const themeDir = join(root, theme)
      if (!isDir(themeDir)) continue
      add(theme, join(themeDir, 'alarms'))
      add(theme, join(themeDir, 'default/alarms'))
    }
  }

  return found
}

function soundsFromDir(dir: string, theme: string): AlarmSound[] {
  return listFiles(dir)
    .filter((file) => EXTENSIONS.has(extname(file).toLowerCase()))
    .map((file) => ({
      path: join(dir, file),
      name: prettyName(file),
      theme
    }))
}

export function listAlarmSounds(): AlarmSound[] {
  const listed: AlarmSound[] = []
  const seen = new Set<string>()

  const push = (sound: AlarmSound) => {
    if (seen.has(sound.path) || !existsSync(sound.path)) return
    seen.add(sound.path)
    listed.push(sound)
  }

  for (const { theme, dir } of alarmDirs()) {
    for (const sound of soundsFromDir(dir, theme === 'gnome' ? 'GNOME' : theme)) {
      push(sound)
    }
  }

  listed.sort((a, b) => a.name.localeCompare(b.name) || a.theme.localeCompare(b.theme))

  for (const path of CLASSIC_TONES) {
    push({
      path,
      name: prettyName(path),
      theme: path.includes('/Yaru/') ? 'Yaru' : 'Freedesktop'
    })
  }

  return listed
}

export function defaultSoundPath(): string {
  const gnome = listFiles('/usr/share/sounds/gnome/default/alarms')
    .filter((file) => EXTENSIONS.has(extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b))[0]
  if (gnome) return join('/usr/share/sounds/gnome/default/alarms', gnome)
  const sounds = listAlarmSounds()
  return (
    sounds.find((item) => item.path.endsWith('alarm-clock-elapsed.oga'))?.path ??
    sounds[0]?.path ??
    '/usr/share/sounds/freedesktop/stereo/alarm-clock-elapsed.oga'
  )
}
