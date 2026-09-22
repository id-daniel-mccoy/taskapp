import { execFile, spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { randomUUID } from 'node:crypto'
import { app } from 'electron'
import { toCalendar } from '../shared/alarm-time'
import { inferFileType } from '../shared/mime'
import type { Alarm } from '../shared/types'
import { defaultSoundPath, listAlarmSounds } from './sounds'

const execFileAsync = promisify(execFile)
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SYSTEMCTL = '/usr/bin/systemctl'
const SYSTEMD_RUN = '/usr/bin/systemd-run'

interface AlarmStore {
  alarms: Alarm[]
}

let storeCache: AlarmStore | null = null

export function invalidateAlarmCache(): void {
  storeCache = null
}
let previewProcess: ChildProcess | null = null
let previewPath: string | null = null
let systemdReady: boolean | null = null

export function appRoot(): string {
  return join(__dirname, '../..')
}

export function alarmHelperPath(): string {
  return join(appRoot(), 'taskapp-alarm')
}

function storePath(): string {
  return join(app.getPath('userData'), 'alarms.json')
}

function userUnitDir(): string {
  return join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'systemd/user')
}

export function runtimeDir(): string {
  if (process.env.XDG_RUNTIME_DIR) return join(process.env.XDG_RUNTIME_DIR, 'taskapp')
  const uid = process.getuid?.()
  if (typeof uid === 'number' && existsSync(`/run/user/${uid}`)) {
    return join(`/run/user/${uid}`, 'taskapp')
  }
  return join('/tmp', `taskapp-${uid ?? 'user'}`)
}

function unitName(id: string, kind: 'service' | 'timer' | 'snooze'): string {
  if (kind === 'snooze') return `taskapp-alarm-snooze-${id}`
  return `taskapp-alarm-${id}.${kind}`
}

function assertAlarmId(id: string): void {
  if (!ID_PATTERN.test(id)) throw new Error('Invalid alarm id.')
}

function clampHour(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 23) throw new Error('Hour must be between 0 and 23.')
  return value
}

function clampMinute(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 59) throw new Error('Minute must be between 0 and 59.')
  return value
}

function normalizeDays(days: number[] | undefined): number[] {
  const unique = [...new Set((days ?? []).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))]
  unique.sort((a, b) => a - b)
  return unique
}

function sanitizeAlarm(raw: Partial<Alarm>, fallback?: Alarm): Alarm {
  const id = raw.id && ID_PATTERN.test(raw.id) ? raw.id : fallback?.id
  if (!id) throw new Error('Invalid alarm id.')
  const now = Date.now()
  return {
    id,
    enabled: Boolean(raw.enabled ?? fallback?.enabled ?? true),
    hour: clampHour(raw.hour ?? fallback?.hour ?? 7),
    minute: clampMinute(raw.minute ?? fallback?.minute ?? 0),
    label: String(raw.label ?? fallback?.label ?? 'Alarm').trim().slice(0, 80) || 'Alarm',
    days: normalizeDays(raw.days ?? fallback?.days),
    soundPath: String(raw.soundPath ?? fallback?.soundPath ?? defaultSoundPath()),
    snoozeMinutes: [5, 10, 15, 20, 30].includes(raw.snoozeMinutes ?? fallback?.snoozeMinutes ?? 10)
      ? (raw.snoozeMinutes ?? fallback?.snoozeMinutes ?? 10)
      : 10,
    createdAt: fallback?.createdAt ?? raw.createdAt ?? now,
    updatedAt: now
  }
}

async function readStore(): Promise<AlarmStore> {
  if (storeCache) return storeCache
  try {
    const parsed = JSON.parse(await readFile(storePath(), 'utf8')) as AlarmStore
    storeCache = { alarms: Array.isArray(parsed.alarms) ? parsed.alarms : [] }
  } catch {
    storeCache = { alarms: [] }
  }
  return storeCache
}

async function writeStore(store: AlarmStore): Promise<void> {
  storeCache = store
  const temp = `${storePath()}.tmp`
  await writeFile(temp, `${JSON.stringify(store, null, 2)}\n`, 'utf8')
  await rename(temp, storePath())
}

async function systemctl(args: string[]): Promise<{ ok: boolean; stdout: string }> {
  if (!existsSync(SYSTEMCTL)) return { ok: false, stdout: '' }
  try {
    const { stdout } = await execFileAsync(SYSTEMCTL, args, { timeout: 8000 })
    return { ok: true, stdout: stdout ?? '' }
  } catch {
    return { ok: false, stdout: '' }
  }
}

export async function hasSystemdUser(): Promise<boolean> {
  if (systemdReady === true) return true
  const result = await systemctl(['--user', 'show-environment'])
  systemdReady = result.ok ? true : null
  return result.ok
}

function serviceUnit(alarm: Alarm): string {
  const helper = alarmHelperPath()
  return `[Unit]
Description=Taskapp alarm ${alarm.label.replace(/[\n\r]/g, ' ')}
After=graphical-session.target

[Service]
Type=simple
ExecStart="${helper}" ring ${alarm.id}
Restart=no

[Install]
WantedBy=default.target
`
}

function timerUnit(alarm: Alarm): string {
  return `[Unit]
Description=Taskapp alarm timer ${alarm.label}

[Timer]
OnCalendar=${toCalendar(alarm.hour, alarm.minute, alarm.days)}
AccuracySec=1s
Persistent=false
Unit=${unitName(alarm.id, 'service')}

[Install]
WantedBy=timers.target
`
}

async function writeUnit(name: string, contents: string): Promise<void> {
  const dir = userUnitDir()
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, name), contents, 'utf8')
}

async function removeUnitFiles(id: string): Promise<void> {
  for (const name of [unitName(id, 'service'), unitName(id, 'timer')]) {
    try {
      await unlink(join(userUnitDir(), name))
    } catch {
      // already gone
    }
  }
}

async function stopSnooze(id: string): Promise<void> {
  const name = unitName(id, 'snooze')
  await systemctl(['--user', 'stop', `${name}.service`])
  await systemctl(['--user', 'stop', `${name}.timer`])
  await systemctl(['--user', 'reset-failed', name, `${name}.service`, `${name}.timer`])
}

export async function unscheduleAlarm(id: string): Promise<void> {
  assertAlarmId(id)
  await stopSnooze(id)
  await systemctl(['--user', 'disable', '--now', unitName(id, 'timer')])
  await systemctl(['--user', 'stop', unitName(id, 'service')])
  await removeUnitFiles(id)
}

export async function scheduleAlarm(alarm: Alarm): Promise<void> {
  if (!(await hasSystemdUser())) return
  await unscheduleAlarm(alarm.id)
  if (!alarm.enabled) {
    await systemctl(['--user', 'daemon-reload'])
    return
  }
  await writeUnit(unitName(alarm.id, 'service'), serviceUnit(alarm))
  await writeUnit(unitName(alarm.id, 'timer'), timerUnit(alarm))
  await systemctl(['--user', 'daemon-reload'])
  await systemctl(['--user', 'enable', '--now', unitName(alarm.id, 'timer')])
}

export async function syncAllAlarms(): Promise<void> {
  const store = await readStore()
  if (!(await hasSystemdUser())) return
  for (const alarm of store.alarms) {
    await scheduleAlarm(alarm)
  }
}

export async function listAlarms(): Promise<Alarm[]> {
  const store = await readStore()
  return store.alarms
}

export async function createAlarm(input?: Partial<Alarm>): Promise<Alarm> {
  const store = await readStore()
  const now = new Date()
  const nextHour = (now.getHours() + 1) % 24
  const alarm = sanitizeAlarm({
    id: randomUUID(),
    enabled: true,
    hour: nextHour,
    minute: 0,
    label: nextUntitled(store.alarms),
    days: [],
    soundPath: defaultSoundPath(),
    snoozeMinutes: 10,
    ...input
  })
  await writeStore({ alarms: [...store.alarms, alarm] })
  await scheduleAlarm(alarm)
  return alarm
}

export async function updateAlarm(id: string, patch: Partial<Alarm>): Promise<Alarm> {
  assertAlarmId(id)
  const store = await readStore()
  const current = store.alarms.find((item) => item.id === id)
  if (!current) throw new Error('Could not find that alarm.')
  const alarm = sanitizeAlarm({ ...current, ...patch, id }, current)
  await writeStore({
    alarms: store.alarms.map((item) => (item.id === id ? alarm : item))
  })
  await scheduleAlarm(alarm)
  return alarm
}

export async function deleteAlarm(id: string): Promise<void> {
  assertAlarmId(id)
  const store = await readStore()
  await writeStore({ alarms: store.alarms.filter((item) => item.id !== id) })
  await unscheduleAlarm(id)
}

export async function disableOneShot(id: string): Promise<Alarm | null> {
  const store = await readStore()
  const current = store.alarms.find((item) => item.id === id)
  if (!current || current.days.length) return current ?? null
  return updateAlarm(id, { enabled: false })
}

function nextUntitled(alarms: Alarm[]): string {
  const used = new Set(alarms.map((item) => item.label))
  if (!used.has('Alarm')) return 'Alarm'
  let index = 2
  while (used.has(`Alarm ${index}`)) index += 1
  return `Alarm ${index}`
}

export { listAlarmSounds }

function firstPlayer(): { bin: string; args: string[] } | null {
  const candidates: { bin: string; args: string[] }[] = [
    { bin: '/usr/bin/pw-play', args: [] },
    { bin: '/usr/bin/canberra-gtk-play', args: ['-f'] },
    { bin: '/usr/bin/paplay', args: [] },
    { bin: '/usr/local/bin/paplay', args: [] }
  ]
  return candidates.find((candidate) => existsSync(candidate.bin)) ?? null
}

export function stopPreview(): void {
  const child = previewProcess
  previewProcess = null
  previewPath = null
  if (!child?.pid) return
  try {
    child.kill('SIGKILL')
  } catch {
    // already gone
  }
}

function previewIsLive(filePath: string): boolean {
  return previewPath === filePath && Boolean(previewProcess?.pid) && pidAlive(previewProcess.pid)
}

export async function previewSound(
  filePath: string
): Promise<{ ok: true; mime: string; data: string; native: boolean; stopped: boolean } | { ok: false; error: string }> {
  if (!filePath || typeof filePath !== 'string') {
    return { ok: false, error: 'Could not play that sound.' }
  }
  if (previewIsLive(filePath)) {
    stopPreview()
    return { ok: true, mime: 'audio/ogg', data: '', native: true, stopped: true }
  }
  stopPreview()
  try {
    const info = await stat(filePath)
    if (!info.isFile()) {
      return { ok: false, error: 'That sound file is not on this computer.' }
    }
    if (info.size > 8 * 1024 * 1024) {
      return { ok: false, error: 'That sound file is too large to preview.' }
    }
    const type = inferFileType(filePath)
    if (type.kind !== 'audio') {
      return { ok: false, error: 'That file is not an audio tone.' }
    }
    const player = firstPlayer()
    if (player) {
      previewProcess = spawn(player.bin, [...player.args, filePath], {
        stdio: 'ignore',
        env: process.env
      })
      previewPath = filePath
      const child = previewProcess
      child.on('error', () => {
        if (previewProcess === child) {
          previewProcess = null
          previewPath = null
        }
      })
      child.on('exit', () => {
        if (previewProcess === child) {
          previewProcess = null
          previewPath = null
        }
      })
      return { ok: true, mime: type.mime, data: '', native: true, stopped: false }
    }
    const buf = await readFile(filePath)
    previewPath = filePath
    return { ok: true, mime: type.mime, data: buf.toString('base64'), native: false, stopped: false }
  } catch {
    return { ok: false, error: 'Could not read that sound file.' }
  }
}

async function readPid(file: string): Promise<number | null> {
  try {
    const value = Number((await readFile(file, 'utf8')).trim())
    return Number.isInteger(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

export async function ringingAlarmId(): Promise<string | null> {
  const dir = runtimeDir()
  const pid = await readPid(join(dir, 'player.pid'))
  const helper = await readPid(join(dir, 'ring.pid'))
  const alive = (pid && pidAlive(pid)) || (helper && pidAlive(helper))
  if (!alive) return null
  try {
    const id = (await readFile(join(dir, 'ring.id'), 'utf8')).trim()
    return ID_PATTERN.test(id) ? id : null
  } catch {
    return null
  }
}

export async function ringingAlarm(): Promise<Alarm | null> {
  const id = await ringingAlarmId()
  if (!id) return null
  const store = await readStore()
  return store.alarms.find((item) => item.id === id) ?? null
}

export async function stopRing(): Promise<void> {
  stopPreview()
  const dir = runtimeDir()
  const helper = alarmHelperPath()
  if (existsSync(helper)) {
    try {
      await execFileAsync(helper, ['stop'], { timeout: 5000 })
      return
    } catch {
      // fall through and kill pids ourselves
    }
  }
  for (const name of ['player.pid', 'ring.pid']) {
    const pid = await readPid(join(dir, name))
    if (pid && pidAlive(pid)) {
      try {
        process.kill(pid, 'SIGTERM')
      } catch {
        // already gone
      }
    }
  }
  for (const name of ['player.pid', 'ring.pid', 'ring.id']) {
    try {
      await unlink(join(dir, name))
    } catch {
      // already gone
    }
  }
}

export async function snoozeAlarm(id: string): Promise<void> {
  assertAlarmId(id)
  const store = await readStore()
  const alarm = store.alarms.find((item) => item.id === id)
  if (!alarm) throw new Error('Could not find that alarm.')
  await stopRing()
  if (!(await hasSystemdUser()) || !existsSync(SYSTEMD_RUN)) return
  await stopSnooze(id)
  const minutes = alarm.snoozeMinutes || 10
  try {
    await execFileAsync(
      SYSTEMD_RUN,
      [
        '--user',
        `--on-active=${minutes}min`,
        `--unit=${unitName(id, 'snooze')}`,
        '--timer-property=AccuracySec=1s',
        '--collect',
        alarmHelperPath(),
        'ring',
        id
      ],
      { timeout: 8000 }
    )
  } catch {
    // Snooze is best-effort if systemd-run is unavailable.
  }
}

export function parseAlarmArgs(argv: string[]): { action: 'ring' | 'snooze' | 'stop'; id?: string }[] {
  const commands: { action: 'ring' | 'snooze' | 'stop'; id?: string }[] = []
  for (const value of argv) {
    if (value.startsWith('--alarm-ring=')) {
      commands.push({ action: 'ring', id: value.slice('--alarm-ring='.length) })
    } else if (value.startsWith('--alarm-snooze=')) {
      commands.push({ action: 'snooze', id: value.slice('--alarm-snooze='.length) })
    } else if (value === '--alarm-stop') {
      commands.push({ action: 'stop' })
    }
  }
  return commands
}
