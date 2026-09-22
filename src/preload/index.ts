import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type {
  Alarm,
  AlarmSound,
  AppSettings,
  MenuCommand,
  NoteRecord,
  NotesLibrary,
  OpenFileResult
} from '../shared/types'

type AlarmResult = { ok: true; alarm: Alarm; systemd?: boolean } | { ok: false; error: string }

export interface TaskappApi {
  getSettings: () => Promise<AppSettings>
  setSettings: (settings: AppSettings) => Promise<AppSettings>
  openDialog: () => Promise<{ canceled: boolean; paths: string[] }>
  saveDialog: (defaultPath?: string) => Promise<{ canceled: boolean; path?: string }>
  openPath: (filePath: string) => Promise<OpenFileResult>
  writeFile: (filePath: string, content: string) => Promise<{ ok: boolean; error?: string }>
  listNotes: () => Promise<NotesLibrary>
  createNote: (content?: string, title?: string, id?: string) => Promise<{ record: NoteRecord; content: string }>
  writeNote: (id: string, content: string) => Promise<{ ok: boolean; record?: NoteRecord; error?: string }>
  renameNote: (id: string, title: string) => Promise<{ ok: boolean; record?: NoteRecord; error?: string }>
  notePath: (id: string) => Promise<{ ok: boolean; path?: string; error?: string }>
  deleteNote: (id: string) => Promise<{ ok: boolean }>
  notesDir: () => Promise<string>
  listAlarms: () => Promise<Alarm[]>
  createAlarm: (input?: Partial<Alarm>) => Promise<AlarmResult>
  updateAlarm: (id: string, patch: Partial<Alarm>) => Promise<AlarmResult>
  deleteAlarm: (id: string) => Promise<{ ok: boolean; error?: string }>
  listAlarmSounds: () => Promise<AlarmSound[]>
  previewAlarmSound: (filePath: string) => Promise<{ ok: true; mime: string; data: string; native: boolean; stopped: boolean } | { ok: false; error: string }>
  stopAlarmPreview: () => Promise<{ ok: boolean }>
  ringingAlarm: () => Promise<Alarm | null>
  hasAlarmSystemd: () => Promise<boolean>
  stopAlarm: () => Promise<{ ok: boolean }>
  snoozeAlarm: (id: string) => Promise<{ ok: boolean; error?: string }>
  onAlarmRing: (handler: (alarm: Alarm) => void) => () => void
  onAlarmStopped: (handler: () => void) => () => void
  showInFolder: (filePath: string) => Promise<void>
  showNotesFolder: () => Promise<void>
  minimize: () => void
  maximize: () => void
  close: () => void
  setTitle: (title: string) => void
  pathForFile: (file: File) => string
  allowClose: () => void
  onMenuCommand: (handler: (command: MenuCommand) => void) => () => void
  onOpenPaths: (handler: (paths: string[]) => void) => () => void
  takePendingOpens: () => Promise<string[]>
  onCloseRequested: (handler: () => void) => () => void
}

const api: TaskappApi = {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings) => ipcRenderer.invoke('settings:set', settings),
  openDialog: () => ipcRenderer.invoke('dialog:open'),
  saveDialog: (defaultPath) => ipcRenderer.invoke('dialog:save', defaultPath),
  openPath: (filePath) => ipcRenderer.invoke('fs:open', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:write', filePath, content),
  listNotes: () => ipcRenderer.invoke('notes:list'),
  createNote: (content, title, id) => ipcRenderer.invoke('notes:create', content, title, id),
  writeNote: (id, content) => ipcRenderer.invoke('notes:write', id, content),
  renameNote: (id, title) => ipcRenderer.invoke('notes:rename', id, title),
  notePath: (id) => ipcRenderer.invoke('notes:path', id),
  deleteNote: (id) => ipcRenderer.invoke('notes:delete', id),
  notesDir: () => ipcRenderer.invoke('notes:dir'),
  listAlarms: () => ipcRenderer.invoke('alarms:list'),
  createAlarm: (input) => ipcRenderer.invoke('alarms:create', input),
  updateAlarm: (id, patch) => ipcRenderer.invoke('alarms:update', id, patch),
  deleteAlarm: (id) => ipcRenderer.invoke('alarms:delete', id),
  listAlarmSounds: () => ipcRenderer.invoke('alarms:sounds'),
  previewAlarmSound: (filePath) => ipcRenderer.invoke('alarms:preview', filePath),
  stopAlarmPreview: () => ipcRenderer.invoke('alarms:stop-preview'),
  ringingAlarm: () => ipcRenderer.invoke('alarms:ringing'),
  hasAlarmSystemd: () => ipcRenderer.invoke('alarms:systemd'),
  stopAlarm: () => ipcRenderer.invoke('alarms:stop'),
  snoozeAlarm: (id) => ipcRenderer.invoke('alarms:snooze', id),
  onAlarmRing: (handler) => {
    const listener = (_event: unknown, alarm: Alarm) => handler(alarm)
    ipcRenderer.on('alarm:ring', listener)
    return () => ipcRenderer.removeListener('alarm:ring', listener)
  },
  onAlarmStopped: (handler) => {
    const listener = () => handler()
    ipcRenderer.on('alarm:stopped', listener)
    return () => ipcRenderer.removeListener('alarm:stopped', listener)
  },
  showInFolder: (filePath) => ipcRenderer.invoke('shell:show', filePath),
  showNotesFolder: () => ipcRenderer.invoke('shell:showNotes'),
  minimize: () => ipcRenderer.send('window:min'),
  maximize: () => ipcRenderer.send('window:max'),
  close: () => ipcRenderer.send('window:close'),
  setTitle: (title) => ipcRenderer.send('window:title', title),
  pathForFile: (file) => webUtils.getPathForFile(file),
  allowClose: () => ipcRenderer.send('window:allow-close'),
  onMenuCommand: (handler) => {
    const listener = (_event: unknown, command: MenuCommand) => handler(command)
    ipcRenderer.on('menu:command', listener)
    return () => ipcRenderer.removeListener('menu:command', listener)
  },
  onOpenPaths: (handler) => {
    const listener = (_event: unknown, paths: string[]) => handler(paths)
    ipcRenderer.on('app:open-paths', listener)
    return () => ipcRenderer.removeListener('app:open-paths', listener)
  },
  takePendingOpens: () => ipcRenderer.invoke('app:take-pending-opens'),
  onCloseRequested: (handler) => {
    const listener = () => handler()
    ipcRenderer.on('app:close-requested', listener)
    return () => ipcRenderer.removeListener('app:close-requested', listener)
  }
}

contextBridge.exposeInMainWorld('taskapp', api)
