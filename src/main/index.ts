import { app, BrowserWindow, Menu, dialog, ipcMain, shell } from 'electron'
import { existsSync, mkdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { mkdir, open, readFile, stat, writeFile } from 'node:fs/promises'
import { isAbsolute, join, resolve } from 'node:path'
import { DIALOG_FILTERS, displayName, inferFileType } from '../shared/mime'
import { normalizeTheme, THEMES, themeWindowColor } from '../shared/themes'
import type { Alarm, AppSettings, MenuCommand, OpenFileResult, RecentFile } from '../shared/types'
import { createAlarm, deleteAlarm, disableOneShot, hasSystemdUser, invalidateAlarmCache, listAlarmSounds, listAlarms, parseAlarmArgs, previewSound, ringingAlarm, snoozeAlarm, stopPreview, stopRing, syncAllAlarms, updateAlarm } from './alarms'
import { createNote, deleteNote, isPlainTextNote, loadLibrary, notePath, notesDir, renameNote, writeNote } from './notes'

function linuxSandboxIsReady(): boolean {
  const helper = join(process.resourcesPath || '', 'chrome-sandbox')
  const unpacked = join(__dirname, '../../node_modules/electron/dist/chrome-sandbox')
  const candidate = existsSync(unpacked) ? unpacked : helper
  try {
    const mode = statSync(candidate).mode
    return (mode & 0o4000) !== 0 && (mode & 0o111) !== 0
  } catch {
    return false
  }
}

if (process.platform === 'linux' && !linuxSandboxIsReady()) {
  app.commandLine.appendSwitch('no-sandbox')
}
app.commandLine.appendSwitch('log-level', '3')

const TEXT_LIMIT = 25 * 1024 * 1024
const PDF_LIMIT = 80 * 1024 * 1024
const IMAGE_LIMIT = 40 * 1024 * 1024
const AUDIO_LIMIT = 80 * 1024 * 1024
const MAX_RECENTS = 16

const defaultSettings: AppSettings = {
  theme: 'dark',
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
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    settingsCache = { ...defaultSettings, ...parsed, theme: normalizeTheme(parsed.theme) }
  } catch {
    settingsCache = { ...defaultSettings }
  }
  return settingsCache
}

async function saveSettings(next: AppSettings): Promise<void> {
  settingsCache = next
  await writeFile(settingsPath(), JSON.stringify(next, null, 2), 'utf8')
}

function asOpenableFile(value: string, cwd = process.cwd()): string | null {
  if (!value || value.startsWith('-')) return null
  if (value === '.' || value === '..') return null
  if (value === process.execPath) return null
  if (value.endsWith('.js') && value.includes('out/')) return null
  const full = isAbsolute(value) ? value : resolve(cwd, value)
  try {
    if (!statSync(full).isFile()) return null
  } catch {
    return null
  }
  return full
}

function collectOpenPaths(argv: string[] = process.argv, cwd = process.cwd()): string[] {
  const seen = new Set<string>()
  const paths: string[] = []
  for (const value of argv) {
    const full = asOpenableFile(value, cwd)
    if (!full || seen.has(full)) continue
    seen.add(full)
    paths.push(full)
  }
  return paths
}

let pendingOpen: string[] = []
let pendingAlarm: Alarm | null = null
let rendererReady = false

function instancePidPath(): string {
  return join(app.getPath('userData'), 'instance.pid')
}

function writeInstancePid(): void {
  try {
    mkdirSync(app.getPath('userData'), { recursive: true })
    writeFileSync(instancePidPath(), String(process.pid), 'utf8')
  } catch {
    // Launchers use this to forward Open with into the running window.
  }
}

function clearInstancePid(): void {
  try {
    unlinkSync(instancePidPath())
  } catch {
    // already gone
  }
}

function enqueueOpen(paths: string[]): void {
  for (const filePath of paths) {
    if (!pendingOpen.includes(filePath)) pendingOpen.push(filePath)
  }
  flushPendingOpen()
}

function flushPendingOpen(): void {
  if (!rendererReady || !mainWindow || mainWindow.isDestroyed() || !pendingOpen.length) return
  const paths = pendingOpen
  pendingOpen = []
  mainWindow.webContents.send('app:open-paths', paths)
}

function sendAlarmRing(alarm: Alarm): void {
  pendingAlarm = alarm
  if (!rendererReady || !mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents.send('alarm:ring', alarm)
}

function sendAlarmStopped(): void {
  pendingAlarm = null
  if (!rendererReady || !mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents.send('alarm:stopped')
}

async function handleAlarmCommands(argv: string[]): Promise<void> {
  const commands = parseAlarmArgs(argv)
  for (const command of commands) {
    if (command.action === 'stop') {
      await stopRing()
      sendAlarmStopped()
      continue
    }
    if (!command.id) continue
    if (command.action === 'snooze') {
      await snoozeAlarm(command.id)
      sendAlarmStopped()
      continue
    }
    invalidateAlarmCache()
    stopPreview()
    const alarm = (await disableOneShot(command.id)) ?? (await listAlarms()).find((item) => item.id === command.id)
    if (!alarm) continue
    sendAlarmRing(alarm)
    focusMainWindow()
  }
}

function focusMainWindow(): void {
  const win = mainWindow
  if (!win || win.isDestroyed()) return
  if (win.isMinimized()) win.restore()
  win.show()
  win.setAlwaysOnTop(true)
  win.focus()
  app.focus({ steal: true })
  win.setAlwaysOnTop(false)
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
        error: `${displayName(filePath)} is not a supported note, text, PDF, image, or audio file.`
      }
    }

    if (type.kind === 'image') {
      if (info.size > IMAGE_LIMIT) {
        return { ok: false, error: 'This image is larger than the 40 MB viewing limit.' }
      }
      const data = await readFile(filePath)
      return {
        ok: true,
        kind: 'image',
        path: filePath,
        name: displayName(filePath),
        mime: type.mime,
        language: 'image',
        label: type.label,
        data: new Uint8Array(data)
      }
    }

    if (type.kind === 'audio') {
      if (info.size > AUDIO_LIMIT) {
        return { ok: false, error: 'This audio file is larger than the 80 MB playback limit.' }
      }
      const data = await readFile(filePath)
      return {
        ok: true,
        kind: 'audio',
        path: filePath,
        name: displayName(filePath),
        mime: type.mime,
        language: 'audio',
        label: type.label,
        data: new Uint8Array(data)
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

    if (type.kind === 'json') {
      if (info.size > TEXT_LIMIT) {
        return { ok: false, error: 'This JSON file is larger than the 25 MB reading limit.' }
      }
      const content = await readFile(filePath, 'utf8')
      return {
        ok: true,
        kind: 'json',
        path: filePath,
        name: displayName(filePath),
        mime: type.mime,
        language: 'json',
        label: type.label,
        content
      }
    }

    if (type.kind !== 'text') {
      return {
        ok: false,
        error: 'That file type cannot be opened. Drop a note, text file, JSON, PDF, image, or audio file.'
      }
    }

    if (await looksBinary(filePath)) {
      return {
        ok: false,
        error: `${displayName(filePath)} appears to be binary and cannot be opened as text.`
      }
    }

    if (info.size > TEXT_LIMIT) {
      return { ok: false, error: 'This file is larger than the 25 MB text-reading limit.' }
    }

    const content = await readFile(filePath, 'utf8')
    if (isPlainTextNote(filePath, type.mime)) {
      return {
        ok: true,
        kind: 'text',
        path: filePath,
        name: displayName(filePath),
        mime: 'text/plain',
        language: 'plaintext',
        label: 'Plain Text',
        content
      }
    }

    return {
      ok: true,
      kind: 'text-file',
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
  return Menu.buildFromTemplate([
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' as const }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'New note', accelerator: 'CmdOrCtrl+N', click: () => sendMenu('new') },
        { label: 'Open…', accelerator: 'CmdOrCtrl+O', click: () => sendMenu('open') },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => sendMenu('save') },
        { label: 'Save as…', accelerator: 'CmdOrCtrl+Shift+S', click: () => sendMenu('save-as') },
        { type: 'separator' },
        { label: 'Rename note', accelerator: 'F2', click: () => sendMenu('rename') },
        { label: 'Duplicate note', click: () => sendMenu('duplicate') },
        { label: 'Delete note', click: () => sendMenu('delete-note') },
        { label: 'Close viewer', accelerator: 'CmdOrCtrl+W', click: () => sendMenu('close') },
        { type: 'separator' },
        { label: 'Show in folder', click: () => sendMenu('show-in-folder') },
        { label: 'Show notes folder', click: () => sendMenu('show-notes-folder') },
        { type: 'separator' },
        { label: 'Settings', accelerator: 'CmdOrCtrl+,', click: () => sendMenu('settings') },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => mainWindow?.close() }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        { label: 'Find', accelerator: 'CmdOrCtrl+F', click: () => sendMenu('find') }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Command palette', accelerator: 'CmdOrCtrl+K', click: () => sendMenu('command-palette') },
        { type: 'separator' },
        {
          label: 'Theme',
          submenu: THEMES.map((item) => ({
            label: item.label,
            click: () => sendMenu(item.command)
          }))
        },
        { label: 'Next theme', accelerator: 'CmdOrCtrl+Shift+T', click: () => sendMenu('toggle-theme') },
        { label: 'Word wrap', accelerator: 'Alt+Z', click: () => sendMenu('toggle-wrap') },
        { type: 'separator' },
        { label: 'Larger text', accelerator: 'CmdOrCtrl+=', click: () => sendMenu('font-larger') },
        { label: 'Smaller text', accelerator: 'CmdOrCtrl+-', click: () => sendMenu('font-smaller') },
        { type: 'separator' },
        { label: 'Keyboard shortcuts', accelerator: 'CmdOrCtrl+/', click: () => sendMenu('shortcuts') }
      ]
    },
    {
      label: 'Help',
      submenu: [{ label: 'Coming Soon...', enabled: false }]
    }
  ])
}

function attachEditorContextMenu(win: BrowserWindow): void {
  win.webContents.on('context-menu', (_event, params) => {
    if (!params.isEditable && !params.selectionText.trim()) return

    const items: Electron.MenuItemConstructorOptions[] = []
    if (params.isEditable) {
      for (const suggestion of params.dictionarySuggestions.slice(0, 5)) {
        items.push({
          label: suggestion,
          click: () => win.webContents.replaceMisspelling(suggestion)
        })
      }
      if (params.misspelledWord) {
        items.push({
          label: 'Add to dictionary',
          click: () => win.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
        })
      }
      if (items.length) items.push({ type: 'separator' })
      items.push(
        { role: 'undo', enabled: params.editFlags.canUndo },
        { role: 'redo', enabled: params.editFlags.canRedo },
        { type: 'separator' },
        { role: 'cut', enabled: params.editFlags.canCut },
        { role: 'copy', enabled: params.editFlags.canCopy },
        { role: 'paste', enabled: params.editFlags.canPaste },
        { role: 'selectAll', enabled: params.editFlags.canSelectAll },
        { type: 'separator' },
        { label: 'Find', accelerator: 'CmdOrCtrl+F', click: () => sendMenu('find') }
      )
    } else {
      items.push({ role: 'copy' })
    }

    Menu.buildFromTemplate(items).popup({ window: win })
  })
}

function createWindow(): BrowserWindow {
  const background = themeWindowColor(normalizeTheme(settingsCache?.theme))
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 860,
    minHeight: 560,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: background,
    icon: iconPath(),
    title: 'Taskapp',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: true
    }
  })

  win.on('close', (event) => {
    if (allowClose) return
    event.preventDefault()
    win.webContents.send('app:close-requested')
  })
  win.on('ready-to-show', () => win.show())
  win.setMenuBarVisibility(false)
  attachEditorContextMenu(win)
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
  ipcMain.handle('app:take-pending-opens', () => {
    rendererReady = true
    const paths = pendingOpen
    pendingOpen = []
    return paths
  })

  ipcMain.handle('settings:get', () => loadSettings())
  ipcMain.handle('settings:set', async (_event, next: AppSettings) => {
    const normalized = { ...next, theme: normalizeTheme(next.theme) }
    await saveSettings(normalized)
    return normalized
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

  ipcMain.handle('dialog:save', async (_event, defaultPath?: string) => {
    if (!mainWindow) return { canceled: true }
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save as',
      defaultPath: defaultPath || 'untitled.txt',
      filters: DIALOG_FILTERS
    })
    return { canceled: result.canceled, path: result.filePath }
  })

  ipcMain.handle('fs:write', async (_event, filePath: string, content: string) => {
    if (!filePath || typeof filePath !== 'string' || typeof content !== 'string') {
      return { ok: false, error: 'Could not save the file.' }
    }
    try {
      const info = await stat(filePath).catch(() => null)
      if (info?.isDirectory()) {
        return { ok: false, error: 'Folders cannot be overwritten. Choose a file instead.' }
      }
      await writeFile(filePath, content, 'utf8')
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Could not save the file.' }
    }
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

  ipcMain.handle('notes:list', () => loadLibrary())
  ipcMain.handle('notes:create', async (_event, content?: string, title?: string, id?: string) => {
    return createNote(content ?? '', title, id)
  })
  ipcMain.handle('notes:write', async (_event, id: string, content: string) => {
    try {
      const record = await writeNote(id, content)
      return { ok: true, record }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Could not save the note.' }
    }
  })
  ipcMain.handle('notes:rename', async (_event, id: string, title: string) => {
    try {
      const record = await renameNote(id, title)
      return { ok: true, record }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Could not rename the note.' }
    }
  })
  ipcMain.handle('notes:path', async (_event, id: string) => {
    try {
      return { ok: true, path: notePath(id) }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Could not find that note.' }
    }
  })
  ipcMain.handle('notes:delete', async (_event, id: string) => {
    await deleteNote(id)
    return { ok: true }
  })
  ipcMain.handle('notes:dir', () => notesDir())

  ipcMain.handle('alarms:list', () => listAlarms())
  ipcMain.handle('alarms:create', async (_event, input?: Partial<Alarm>) => {
    try {
      const alarm = await createAlarm(input)
      return { ok: true, alarm, systemd: await hasSystemdUser() }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Could not create the alarm.' }
    }
  })
  ipcMain.handle('alarms:update', async (_event, id: string, patch: Partial<Alarm>) => {
    try {
      const alarm = await updateAlarm(id, patch)
      return { ok: true, alarm, systemd: await hasSystemdUser() }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Could not update the alarm.' }
    }
  })
  ipcMain.handle('alarms:delete', async (_event, id: string) => {
    try {
      await deleteAlarm(id)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Could not delete the alarm.' }
    }
  })
  ipcMain.handle('alarms:sounds', () => listAlarmSounds())
  ipcMain.handle('alarms:preview', (_event, filePath: string) => previewSound(filePath))
  ipcMain.handle('alarms:stop-preview', () => {
    stopPreview()
    return { ok: true }
  })
  ipcMain.handle('alarms:ringing', async () => pendingAlarm ?? (await ringingAlarm()))
  ipcMain.handle('alarms:systemd', () => hasSystemdUser())
  ipcMain.handle('alarms:stop', async () => {
    await stopRing()
    sendAlarmStopped()
    return { ok: true }
  })
  ipcMain.handle('alarms:snooze', async (_event, id: string) => {
    try {
      await snoozeAlarm(id)
      sendAlarmStopped()
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Could not snooze the alarm.' }
    }
  })

  ipcMain.handle('shell:show', async (_event, filePath: string) => {
    if (filePath) shell.showItemInFolder(filePath)
  })
  ipcMain.handle('shell:showNotes', async () => {
    const dir = notesDir()
    await mkdir(dir, { recursive: true })
    shell.openPath(dir)
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

if (!app.requestSingleInstanceLock()) {
  app.exit(0)
} else {
  writeInstancePid()

  app.on('second-instance', (_event, argv, cwd) => {
    enqueueOpen(collectOpenPaths(argv, cwd))
    void handleAlarmCommands(argv)
    focusMainWindow()
  })

  app.whenReady().then(async () => {
    await loadSettings()
    registerIpc()
    Menu.setApplicationMenu(buildMenu())
    mainWindow = createWindow()
    enqueueOpen(collectOpenPaths())
    await handleAlarmCommands(process.argv)
    const alreadyRinging = await ringingAlarm()
    if (alreadyRinging) sendAlarmRing(alreadyRinging)
    void syncAllAlarms()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        rendererReady = false
        mainWindow = createWindow()
      }
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('open-file', (event, filePath) => {
  event.preventDefault()
  enqueueOpen(collectOpenPaths([filePath]))
})

app.on('quit', () => {
  clearInstancePid()
  stopPreview()
})
