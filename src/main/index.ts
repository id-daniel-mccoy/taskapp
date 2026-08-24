import { app, BrowserWindow, Menu, dialog, ipcMain, shell, nativeTheme } from 'electron'
import { existsSync } from 'node:fs'
import { readFile, writeFile, stat, open } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { DIALOG_FILTERS, displayName, inferFileType } from '../shared/mime'
import type { AppSettings, MenuCommand, OpenFileResult, RecentFile } from '../shared/types'

const TEXT_LIMIT = 25 * 1024 * 1024
const PDF_LIMIT = 80 * 1024 * 1024
const MAX_RECENTS = 16

const defaultSettings: AppSettings = {
  theme: 'system',
  wordWrap: true,
  fontSize: 15,
  recents: []
}

let mainWindow: BrowserWindow | null = null
let settingsCache: AppSettings | null = null
let allowClose = false

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function iconPath(): string {
  return join(__dirname, '../../resources/icon.png')
}

async function loadSettings(): Promise<AppSettings> {
  if (settingsCache) return settingsCache
  try {
    const raw = await readFile(settingsPath(), 'utf8')
    settingsCache = { ...defaultSettings, ...JSON.parse(raw) }
  } catch {
    settingsCache = { ...defaultSettings }
  }
  return settingsCache
}

async function saveSettings(next: AppSettings): Promise<void> {
  settingsCache = next
  await writeFile(settingsPath(), JSON.stringify(next, null, 2), 'utf8')
}

function looksLikeFileArg(value: string): boolean {
  if (!value || value.startsWith('-')) return false
  if (value.includes('electron')) return false
  if (value.endsWith('.js') && value.includes('out/')) return false
  return existsSync(value)
}

function collectOpenPaths(): string[] {
  return process.argv.filter(looksLikeFileArg)
}

async function looksBinary(filePath: string): Promise<boolean> {
  const handle = await open(filePath, 'r')
  try {
    const buf = Buffer.alloc(8192)
    const { bytesRead } = await handle.read(buf, 0, 8192, 0)
    return buf.subarray(0, bytesRead).includes(0)
  } finally {
    await handle.close()
  }
}

async function openPath(filePath: string): Promise<OpenFileResult> {
  try {
    const info = await stat(filePath)
    if (info.isDirectory()) {
      return { ok: false, error: 'Folders cannot be opened. Choose a file instead.' }
    }

    const type = inferFileType(filePath)
    if (type.kind === 'unsupported') {
      return {
        ok: false,
        error: `${displayName(filePath)} looks like a binary file and is not a supported text or PDF type.`
      }
    }

    if (type.kind === 'pdf') {
      if (info.size > PDF_LIMIT) {
        return { ok: false, error: 'This PDF is larger than the 80 MB viewing limit.' }
      }
      const data = await readFile(filePath)
      return {
        ok: true,
        kind: 'pdf',
        path: filePath,
        name: displayName(filePath),
        mime: 'application/pdf',
        language: 'pdf',
        label: type.label,
        data: new Uint8Array(data)
      }
    }

    if (type.kind === 'text' && (await looksBinary(filePath))) {
      return {
        ok: false,
        error: `${displayName(filePath)} appears to be binary and cannot be opened as text.`
      }
    }

    if (info.size > TEXT_LIMIT) {
      return { ok: false, error: 'This file is larger than the 25 MB text-editing limit.' }
    }

    const content = await readFile(filePath, 'utf8')
    return {
      ok: true,
      kind: 'text',
      path: filePath,
      name: displayName(filePath),
      mime: type.mime,
      language: type.language,
      label: type.label,
      content
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not open the file.'
    return { ok: false, error: message }
  }
}

async function rememberRecent(entry: RecentFile): Promise<void> {
  const settings = await loadSettings()
  const recents = [
    entry,
    ...settings.recents.filter((item) => item.path !== entry.path)
  ].slice(0, MAX_RECENTS)
  await saveSettings({ ...settings, recents })
}

function sendMenu(command: MenuCommand): void {
  mainWindow?.webContents.send('menu:command', command)
}

function buildMenu(): Menu {
  const isMac = process.platform === 'darwin'
  return Menu.buildFromTemplate([
    ...(isMac
      ? [{ role: 'appMenu' as const }]
      : [
          {
            label: 'File',
            submenu: [
              { label: 'New note', accelerator: 'CmdOrCtrl+N', click: () => sendMenu('new') },
              { label: 'Open…', accelerator: 'CmdOrCtrl+O', click: () => sendMenu('open') },
              { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => sendMenu('save') },
              { label: 'Save as…', accelerator: 'CmdOrCtrl+Shift+S', click: () => sendMenu('save-as') },
              { label: 'Close tab', accelerator: 'CmdOrCtrl+W', click: () => sendMenu('close') },
              { type: 'separator' },
              { label: 'Show in folder', click: () => sendMenu('show-in-folder') },
              { type: 'separator' },
              { role: 'quit' }
            ]
          }
        ]),
    {
      label: isMac ? 'File' : 'Note',
      submenu: isMac
        ? [
            { label: 'New note', accelerator: 'CmdOrCtrl+N', click: () => sendMenu('new') },
            { label: 'Open…', accelerator: 'CmdOrCtrl+O', click: () => sendMenu('open') },
            { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => sendMenu('save') },
            { label: 'Save as…', accelerator: 'CmdOrCtrl+Shift+S', click: () => sendMenu('save-as') },
            { label: 'Close tab', accelerator: 'CmdOrCtrl+W', click: () => sendMenu('close') },
            { type: 'separator' },
            { label: 'Show in folder', click: () => sendMenu('show-in-folder') }
          ]
        : [
            { label: 'Command palette', accelerator: 'CmdOrCtrl+K', click: () => sendMenu('command-palette') },
            { label: 'Find', accelerator: 'CmdOrCtrl+F', click: () => sendMenu('find') },
            { type: 'separator' },
            { label: 'Format JSON', click: () => sendMenu('format-json') },
            { label: 'Minify JSON', click: () => sendMenu('minify-json') },
            { label: 'Validate JSON', click: () => sendMenu('validate-json') }
          ]
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle theme', accelerator: 'CmdOrCtrl+Shift+T', click: () => sendMenu('toggle-theme') },
        { label: 'Word wrap', accelerator: 'Alt+Z', click: () => sendMenu('toggle-wrap') },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'close' }]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Keyboard shortcuts', accelerator: 'CmdOrCtrl+/', click: () => sendMenu('shortcuts') },
        { label: 'Settings', accelerator: 'CmdOrCtrl+,', click: () => sendMenu('settings') }
      ]
    }
  ])
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 860,
    minHeight: 560,
    show: false,
    frame: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0e1318' : '#f3eee4',
    icon: iconPath(),
    title: 'Taskapp',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.on('close', (event) => {
    if (allowClose) return
    event.preventDefault()
    win.webContents.send('app:close-requested')
  })
  win.on('ready-to-show', () => win.show())
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

function registerIpc(): void {
  ipcMain.handle('settings:get', () => loadSettings())
  ipcMain.handle('settings:set', async (_event, next: AppSettings) => {
    await saveSettings(next)
    return next
  })

  ipcMain.handle('dialog:open', async () => {
    if (!mainWindow) return { canceled: true, paths: [] }
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Open',
      properties: ['openFile', 'multiSelections'],
      filters: DIALOG_FILTERS
    })
    return { canceled: result.canceled, paths: result.filePaths }
  })

  ipcMain.handle('dialog:save', async (_event, suggestedName?: string) => {
    if (!mainWindow) return { canceled: true }
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save as',
      defaultPath: suggestedName || 'untitled.txt',
      filters: DIALOG_FILTERS
    })
    return { canceled: result.canceled, path: result.filePath }
  })

  ipcMain.handle('fs:open', async (_event, filePath: string) => {
    const result = await openPath(filePath)
    if (result.ok) {
      await rememberRecent({
        path: result.path,
        name: result.name,
        mime: result.mime,
        openedAt: Date.now()
      })
    }
    return result
  })

  ipcMain.handle('fs:write', async (_event, filePath: string, content: string) => {
    try {
      await writeFile(filePath, content, 'utf8')
      const type = inferFileType(filePath)
      await rememberRecent({
        path: filePath,
        name: basename(filePath),
        mime: type.mime,
        openedAt: Date.now()
      })
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Could not save the file.' }
    }
  })

  ipcMain.handle('shell:show', async (_event, filePath: string) => {
    if (filePath) shell.showItemInFolder(filePath)
  })

  ipcMain.on('window:min', () => mainWindow?.minimize())
  ipcMain.on('window:max', () => {
    if (!mainWindow) return
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  })
  ipcMain.on('window:close', () => mainWindow?.close())
  ipcMain.on('window:allow-close', () => {
    allowClose = true
    mainWindow?.close()
  })
  ipcMain.on('window:title', (_event, title: string) => {
    mainWindow?.setTitle(title || 'Taskapp')
  })
}

app.setName('Taskapp')

app.whenReady().then(async () => {
  registerIpc()
  Menu.setApplicationMenu(buildMenu())
  mainWindow = createWindow()

  const pending = collectOpenPaths()
  mainWindow.webContents.on('did-finish-load', () => {
    if (pending.length) {
      mainWindow?.webContents.send('app:open-paths', pending)
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('open-file', (event, filePath) => {
  event.preventDefault()
  if (mainWindow) {
    mainWindow.webContents.send('app:open-paths', [filePath])
  }
})
