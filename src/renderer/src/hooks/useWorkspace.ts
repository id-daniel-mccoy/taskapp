import { useCallback, useEffect, useMemo, useState } from 'react'
import { displayName, inferFileType, isJsonLike } from '@shared/mime'
import type { AppSettings, DocumentKind, MenuCommand, OpenFileResult, ThemePreference } from '@shared/types'
import { inspectJson } from '../lib/json'

export interface WorkspaceDocument {
  id: string
  path: string | null
  name: string
  mime: string
  language: string
  label: string
  kind: DocumentKind
  content: string
  pdfData?: Uint8Array
  dirty: boolean
  cursor: { line: number; column: number }
}

interface Toast {
  id: string
  text: string
  tone: 'info' | 'error'
}

const emptySettings: AppSettings = {
  theme: 'system',
  wordWrap: true,
  fontSize: 15,
  recents: []
}

function uid(): string {
  return crypto.randomUUID()
}

function untitledName(existing: WorkspaceDocument[]): string {
  const used = new Set(existing.map((doc) => doc.name))
  let index = 1
  while (used.has(`Untitled-${index}`)) index += 1
  return `Untitled-${index}`
}

function asBytes(data: Uint8Array | ArrayBuffer | number[]): Uint8Array {
  if (data instanceof Uint8Array) return data
  if (data instanceof ArrayBuffer) return new Uint8Array(data)
  return Uint8Array.from(data)
}

function resultToDocument(result: Extract<OpenFileResult, { ok: true }>): WorkspaceDocument {
  if (result.kind === 'pdf') {
    return {
      id: uid(),
      path: result.path,
      name: result.name,
      mime: result.mime,
      language: 'pdf',
      label: result.label,
      kind: 'pdf',
      content: '',
      pdfData: asBytes(result.data),
      dirty: false,
      cursor: { line: 1, column: 1 }
    }
  }
  return {
    id: uid(),
    path: result.path,
    name: result.name,
    mime: result.mime,
    language: result.language,
    label: result.label,
    kind: 'text',
    content: result.content,
    dirty: false,
    cursor: { line: 1, column: 1 }
  }
}

function resolveTheme(preference: ThemePreference): 'ink' | 'paper' {
  if (preference === 'ink' || preference === 'paper') return preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'ink' : 'paper'
}

export function useWorkspace() {
  const [settings, setSettings] = useState<AppSettings>(emptySettings)
  const [docs, setDocs] = useState<WorkspaceDocument[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [pendingClose, setPendingClose] = useState<string | null>(null)
  const [pendingWindowClose, setPendingWindowClose] = useState(false)
  const [ready, setReady] = useState(false)

  const active = docs.find((doc) => doc.id === activeId) ?? null
  const theme = resolveTheme(settings.theme)

  const toast = useCallback((text: string, tone: Toast['tone'] = 'info') => {
    const id = uid()
    setToasts((current) => [...current, { id, text, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 4200)
  }, [])

  const persistSettings = useCallback(async (next: AppSettings) => {
    setSettings(next)
    await window.taskapp.setSettings(next)
  }, [])

  const applyOpenResult = useCallback((result: OpenFileResult) => {
    if (!result.ok) {
      toast(result.error, 'error')
      return
    }
    setDocs((current) => {
      const existing = current.find((doc) => doc.path === result.path)
      if (existing) {
        setActiveId(existing.id)
        return current
      }
      const next = resultToDocument(result)
      setActiveId(next.id)
      return [...current, next]
    })
  }, [toast])

  const openPaths = useCallback(async (paths: string[]) => {
    for (const filePath of paths) {
      applyOpenResult(await window.taskapp.openPath(filePath))
    }
    const latest = await window.taskapp.getSettings()
    setSettings(latest)
  }, [applyOpenResult])

  const newNote = useCallback(() => {
    setDocs((current) => {
      const name = untitledName(current)
      const next: WorkspaceDocument = {
        id: uid(),
        path: null,
        name,
        mime: 'text/plain',
        language: 'plaintext',
        label: 'Plain Text',
        kind: 'text',
        content: '',
        dirty: false,
        cursor: { line: 1, column: 1 }
      }
      setActiveId(next.id)
      return [...current, next]
    })
  }, [])

  const openFiles = useCallback(async () => {
    const dialog = await window.taskapp.openDialog()
    if (!dialog.canceled) await openPaths(dialog.paths)
  }, [openPaths])

  const saveDocument = useCallback(async (doc: WorkspaceDocument, saveAs = false) => {
    if (doc.kind === 'pdf') {
      toast('PDFs open for reading only.')
      return false
    }
    let target = doc.path
    if (!target || saveAs) {
      const picked = await window.taskapp.saveDialog(doc.name)
      if (picked.canceled || !picked.path) return false
      target = picked.path
    }
    const written = await window.taskapp.writeFile(target, doc.content)
    if (!written.ok) {
      toast(written.error || 'Could not save.', 'error')
      return false
    }
    const type = inferFileType(target)
    setDocs((current) =>
      current.map((item) =>
        item.id === doc.id
          ? {
              ...item,
              path: target,
              name: displayName(target!),
              mime: type.mime,
              language: type.kind === 'pdf' ? item.language : type.language,
              label: type.label,
              dirty: false
            }
          : item
      )
    )
    const latest = await window.taskapp.getSettings()
    setSettings(latest)
    return true
  }, [toast])

  const requestClose = useCallback((id: string) => {
    const doc = docs.find((item) => item.id === id)
    if (doc?.dirty) {
      setPendingClose(id)
      return
    }
    setDocs((current) => {
      const next = current.filter((item) => item.id !== id)
      if (activeId === id) {
        const index = current.findIndex((item) => item.id === id)
        setActiveId(next[index]?.id ?? next[index - 1]?.id ?? null)
      }
      return next
    })
  }, [activeId, docs])

  const requestWindowClose = useCallback(() => {
    if (docs.some((doc) => doc.dirty)) {
      setPendingWindowClose(true)
      return
    }
    window.taskapp.allowClose()
  }, [docs])

  const confirmWindowClose = useCallback(async (shouldSave: boolean) => {
    if (shouldSave) {
      for (const doc of docs.filter((item) => item.dirty && item.kind === 'text')) {
        const saved = await saveDocument(doc)
        if (!saved) return
      }
    }
    setPendingWindowClose(false)
    window.taskapp.allowClose()
  }, [docs, saveDocument])

  const confirmClose = useCallback(async (shouldSave: boolean) => {
    if (!pendingClose) return
    const doc = docs.find((item) => item.id === pendingClose)
    if (shouldSave && doc) {
      const saved = await saveDocument(doc)
      if (!saved) return
    }
    const id = pendingClose
    setPendingClose(null)
    setDocs((current) => {
      const next = current.filter((item) => item.id !== id)
      if (activeId === id) {
        const index = current.findIndex((item) => item.id === id)
        setActiveId(next[index]?.id ?? next[index - 1]?.id ?? null)
      }
      return next
    })
  }, [activeId, docs, pendingClose, saveDocument])

  const updateActiveContent = useCallback((content: string) => {
    if (!activeId) return
    setDocs((current) =>
      current.map((item) =>
        item.id === activeId && item.content !== content
          ? { ...item, content, dirty: true }
          : item
      )
    )
  }, [activeId])

  const updateCursor = useCallback((line: number, column: number) => {
    if (!activeId) return
    setDocs((current) =>
      current.map((item) => (item.id === activeId ? { ...item, cursor: { line, column } } : item))
    )
  }, [activeId])

  const setLanguage = useCallback((language: string) => {
    if (!activeId) return
    setDocs((current) =>
      current.map((item) => (item.id === activeId ? { ...item, language } : item))
    )
  }, [activeId])

  const applyJson = useCallback((mode: 'format' | 'minify' | 'validate') => {
    if (!active || active.kind !== 'text') return
    const check = inspectJson(active.content)
    if (!check.ok) {
      toast(check.message, 'error')
      return
    }
    if (mode === 'validate') {
      toast(check.message)
      return
    }
    const next = mode === 'format' ? check.formatted : check.minified
    if (next != null) updateActiveContent(next)
  }, [active, toast, updateActiveContent])

  const handleMenu = useCallback((command: MenuCommand) => {
    if (command === 'new') newNote()
    if (command === 'open') void openFiles()
    if (command === 'save' && active) void saveDocument(active)
    if (command === 'save-as' && active) void saveDocument(active, true)
    if (command === 'close' && active) requestClose(active.id)
    if (command === 'command-palette') setPaletteOpen(true)
    if (command === 'settings') setSettingsOpen(true)
    if (command === 'shortcuts') setShortcutsOpen(true)
    if (command === 'toggle-theme') {
      void persistSettings({
        ...settings,
        theme: theme === 'ink' ? 'paper' : 'ink'
      })
    }
    if (command === 'toggle-wrap') {
      void persistSettings({ ...settings, wordWrap: !settings.wordWrap })
    }
    if (command === 'format-json') applyJson('format')
    if (command === 'minify-json') applyJson('minify')
    if (command === 'validate-json') applyJson('validate')
    if (command === 'show-in-folder' && active?.path) {
      void window.taskapp.showInFolder(active.path)
    }
    if (command === 'find') {
      window.dispatchEvent(new CustomEvent('taskapp:find'))
    }
  }, [active, applyJson, newNote, openFiles, persistSettings, requestClose, saveDocument, settings, theme])

  useEffect(() => {
    let cancelled = false
    void window.taskapp.getSettings()
      .then((loaded) => {
        if (!cancelled) setSettings(loaded)
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const offMenu = window.taskapp.onMenuCommand(handleMenu)
    const offOpen = window.taskapp.onOpenPaths((paths) => {
      void openPaths(paths)
    })
    const offClose = window.taskapp.onCloseRequested(requestWindowClose)
    return () => {
      offMenu()
      offOpen()
      offClose()
    }
  }, [handleMenu, openPaths, requestWindowClose])

  useEffect(() => {
    const title = active ? `${active.dirty ? '• ' : ''}${active.name} — Taskapp` : 'Taskapp'
    window.taskapp.setTitle(title)
  }, [active])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const jsonState = useMemo(() => {
    if (!active || !isJsonLike(active.mime, active.language, active.name)) return null
    return inspectJson(active.content)
  }, [active])

  return {
    ready,
    settings,
    persistSettings,
    theme,
    docs,
    active,
    activeId,
    setActiveId,
    toasts,
    paletteOpen,
    setPaletteOpen,
    settingsOpen,
    setSettingsOpen,
    shortcutsOpen,
    setShortcutsOpen,
    pendingClose,
    setPendingClose,
    pendingWindowClose,
    setPendingWindowClose,
    requestWindowClose,
    confirmWindowClose,
    jsonState,
    toast,
    newNote,
    openFiles,
    openPaths,
    saveDocument,
    requestClose,
    confirmClose,
    updateActiveContent,
    updateCursor,
    setLanguage,
    applyJson,
    handleMenu
  }
}
