import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { AppSettings, MenuCommand, OpenFileResult, SaveDialogResult, WriteFileResult } from '../shared/types'

export interface TaskappApi {
  getSettings: () => Promise<AppSettings>
  setSettings: (settings: AppSettings) => Promise<AppSettings>
  openDialog: () => Promise<{ canceled: boolean; paths: string[] }>
  saveDialog: (suggestedName?: string) => Promise<SaveDialogResult>
  openPath: (filePath: string) => Promise<OpenFileResult>
  writeFile: (filePath: string, content: string) => Promise<WriteFileResult>
  showInFolder: (filePath: string) => Promise<void>
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
  saveDialog: (suggestedName) => ipcRenderer.invoke('dialog:save', suggestedName),
  openPath: (filePath) => ipcRenderer.invoke('fs:open', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:write', filePath, content),
  showInFolder: (filePath) => ipcRenderer.invoke('shell:show', filePath),
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
