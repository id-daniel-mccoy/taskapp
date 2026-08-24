import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type {
  AppSettings,
  MenuCommand,
  NoteRecord,
  NotesLibrary,
  OpenFileResult
} from '../shared/types'

export interface TaskappApi {
  getSettings: () => Promise<AppSettings>
  setSettings: (settings: AppSettings) => Promise<AppSettings>
  openDialog: () => Promise<{ canceled: boolean; paths: string[] }>
  openPath: (filePath: string) => Promise<OpenFileResult>
  listNotes: () => Promise<NotesLibrary>
  createNote: (content?: string, title?: string, id?: string) => Promise<{ record: NoteRecord; content: string }>
  writeNote: (id: string, content: string) => Promise<{ ok: boolean; record?: NoteRecord; error?: string }>
  renameNote: (id: string, title: string) => Promise<{ ok: boolean; record?: NoteRecord; error?: string }>
  notePath: (id: string) => Promise<{ ok: boolean; path?: string; error?: string }>
  deleteNote: (id: string) => Promise<{ ok: boolean }>
  notesDir: () => Promise<string>
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
  onCloseRequested: (handler: () => void) => () => void
}

const api: TaskappApi = {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings) => ipcRenderer.invoke('settings:set', settings),
  openDialog: () => ipcRenderer.invoke('dialog:open'),
  openPath: (filePath) => ipcRenderer.invoke('fs:open', filePath),
  listNotes: () => ipcRenderer.invoke('notes:list'),
  createNote: (content, title, id) => ipcRenderer.invoke('notes:create', content, title, id),
  writeNote: (id, content) => ipcRenderer.invoke('notes:write', id, content),
  renameNote: (id, title) => ipcRenderer.invoke('notes:rename', id, title),
  notePath: (id) => ipcRenderer.invoke('notes:path', id),
  deleteNote: (id) => ipcRenderer.invoke('notes:delete', id),
  notesDir: () => ipcRenderer.invoke('notes:dir'),
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
  onCloseRequested: (handler) => {
    const listener = () => handler()
    ipcRenderer.on('app:close-requested', listener)
    return () => ipcRenderer.removeListener('app:close-requested', listener)
  }
}

contextBridge.exposeInMainWorld('taskapp', api)
