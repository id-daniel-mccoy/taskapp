import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AppSettings,
  EditorSession,
  MenuCommand,
  NoteDocument,
  OpenFileResult
} from '@shared/types'
import { inspectJson } from '../lib/json'
import { runNoteEdit } from '../lib/edit'
import { displayName, inferFileType } from '@shared/mime'
import { nextTheme, normalizeTheme, themeFromCommand } from '@shared/themes'

export interface JsonViewerDoc {
  id: string
  kind: 'json'
  path: string
  name: string
  mime: string
  content: string
  dirty: boolean
}

export interface PdfViewerDoc {
  id: string
  kind: 'pdf'
  path: string
  name: string
  mime: 'application/pdf'
  pdfData: Uint8Array
}

export interface ImageViewerDoc {
  id: string
  kind: 'image'
  path: string
  name: string
  mime: string
  label: string
  data: Uint8Array
}

export interface AudioViewerDoc {
  id: string
  kind: 'audio'
  path: string
  name: string
  mime: string
  label: string
  data: Uint8Array
}

export interface TextFileViewerDoc {
  id: string
  kind: 'text-file'
  path: string
  name: string
  mime: string
  language: string
  label: string
  content: string
  dirty: boolean
}

export type ViewerDoc = JsonViewerDoc | PdfViewerDoc | ImageViewerDoc | AudioViewerDoc | TextFileViewerDoc
export type EditableViewerDoc = JsonViewerDoc | TextFileViewerDoc

function isEditableViewer(doc: ViewerDoc | null | undefined): doc is EditableViewerDoc {
  return Boolean(doc && (doc.kind === 'json' || doc.kind === 'text-file'))
}

function viewerAfterSave(id: string, filePath: string, content: string): EditableViewerDoc {
  const type = inferFileType(filePath)
  const name = displayName(filePath)
  if (type.kind === 'json') {
    return { id, kind: 'json', path: filePath, name, mime: type.mime, content, dirty: false }
  }
  return {
    id,
    kind: 'text-file',
    path: filePath,
    name,
    mime: type.mime.startsWith('image/') || type.kind === 'pdf' || type.kind === 'audio' ? 'text/plain' : type.mime,
    label: type.kind === 'pdf' || type.kind === 'image' || type.kind === 'audio' || type.kind === 'unsupported' ? 'Text' : type.label,
    language: type.language,
    content,
    dirty: false
  }
}

interface Toast {
  id: string
  text: string
  tone: 'info' | 'error'
}

const emptySession: EditorSession = { noteId: null, files: [], activeFile: null }

const emptySettings: AppSettings = {
  theme: 'dark',
  wordWrap: true,
  fontSize: 16,
  recents: [],
  session: emptySession
}

function uid(): string {
  return crypto.randomUUID()
}

function asBytes(data: Uint8Array | ArrayBuffer | number[]): Uint8Array {
  if (data instanceof Uint8Array) return data
  if (data instanceof ArrayBuffer) return new Uint8Array(data)
  return Uint8Array.from(data)
}

function copyTitle(title: string, notes: NoteDocument[]): string {
  const base = `${title} copy`
  if (!notes.some((note) => note.title === base)) return base
  let index = 2
  while (notes.some((note) => note.title === `${title} copy ${index}`)) index += 1
  return `${title} copy ${index}`
}

export function useWorkspace() {
  const [settings, setSettings] = useState<AppSettings>(emptySettings)
  const [notes, setNotes] = useState<NoteDocument[]>([])
  const [viewers, setViewers] = useState<ViewerDoc[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [activeViewerId, setActiveViewerId] = useState<string | null>(null)
  const [notesDir, setNotesDir] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [titleFocusKey, setTitleFocusKey] = useState(0)
  const [ready, setReady] = useState(false)
  const saveTimers = useRef(new Map<string, number>())
  const draftIds = useRef(new Set<string>())
  const lastNoteId = useRef<string | null>(null)

  const activeNote = notes.find((note) => note.id === activeNoteId) ?? null
  const activeViewer = viewers.find((doc) => doc.id === activeViewerId) ?? null
  const theme = normalizeTheme(settings.theme)

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

  const flushNote = useCallback(async (id: string, content: string) => {
    const timer = saveTimers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      saveTimers.current.delete(id)
    }
    const result = await window.taskapp.writeNote(id, content)
    if (!result.ok || !result.record) {
      toast(result.error || 'Could not save the note.', 'error')
      return false
    }
    const record = result.record
    setNotes((current) =>
      current.map((note) =>
        note.id === id
          ? { ...note, content, dirty: false, updatedAt: record.updatedAt }
          : note
      )
    )
    return true
  }, [toast])

  const persistDraft = useCallback(async (id: string, title?: string) => {
    const current = notes.find((note) => note.id === id)
    if (!current) return false
    if (!current.draft && !draftIds.current.has(id)) return true
    const nextTitle = (title ?? current.title).trim().slice(0, 80) || 'Untitled note'
    try {
      const created = await window.taskapp.createNote(current.content, nextTitle, current.id)
      draftIds.current.delete(id)
      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === id
            ? { ...created.record, content: created.content, dirty: false }
            : note
        )
      )
      if (created.record.id !== id) {
        setActiveNoteId((currentId) => (currentId === id ? created.record.id : currentId))
      }
      return true
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not create the note.', 'error')
      return false
    }
  }, [notes, toast])

  const writeFileViewer = useCallback(async (doc: EditableViewerDoc, filePath = doc.path) => {
    const result = await window.taskapp.writeFile(filePath, doc.content)
    if (!result.ok) {
      toast(result.error || 'Could not save the file.', 'error')
      return false
    }
    const next = viewerAfterSave(doc.id, filePath, doc.content)
    setViewers((current) => current.map((item) => (item.id === doc.id ? next : item)))
    return true
  }, [toast])

  const flushAllDirty = useCallback(async () => {
    for (const note of notes) {
      if (note.draft) {
        const saved = await persistDraft(note.id)
        if (!saved) return false
        continue
      }
      if (!note.dirty) continue
      const saved = await flushNote(note.id, note.content)
      if (!saved) return false
    }
    for (const doc of viewers) {
      if (!isEditableViewer(doc) || !doc.dirty) continue
      const saved = await writeFileViewer(doc)
      if (!saved) return false
    }
    return true
  }, [flushNote, notes, persistDraft, viewers, writeFileViewer])

  const selectNote = useCallback((id: string) => {
    setActiveNoteId(id)
    setActiveViewerId(null)
  }, [])

  const newNote = useCallback(() => {
    const now = Date.now()
    const note: NoteDocument = {
      id: crypto.randomUUID(),
      title: 'Untitled note',
      content: '',
      createdAt: now,
      updatedAt: now,
      dirty: false,
      draft: true
    }
    draftIds.current.add(note.id)
    setNotes((current) => [note, ...current])
    setActiveNoteId(note.id)
    setActiveViewerId(null)
    setTitleFocusKey((value) => value + 1)
  }, [])

  const updateNoteContent = useCallback((content: string) => {
    if (!activeNoteId) return
    const draft = draftIds.current.has(activeNoteId)
    setNotes((current) =>
      current.map((note) =>
        note.id === activeNoteId && note.content !== content
          ? { ...note, content, dirty: !draft, updatedAt: Date.now() }
          : note
      )
    )
    if (draft) return
    const timer = saveTimers.current.get(activeNoteId)
    if (timer) window.clearTimeout(timer)
    const id = activeNoteId
    saveTimers.current.set(
      id,
      window.setTimeout(() => {
        void flushNote(id, content)
      }, 400)
    )
  }, [activeNoteId, flushNote])

  const saveActive = useCallback(async () => {
    if (isEditableViewer(activeViewer)) {
      await writeFileViewer(activeViewer)
      return
    }
    if (activeViewer) {
      toast('This file is read only.')
      return
    }
    if (!activeNote) return
    if (activeNote.draft) {
      await persistDraft(activeNote.id)
      return
    }
    await flushNote(activeNote.id, activeNote.content)
  }, [activeNote, activeViewer, flushNote, persistDraft, toast, writeFileViewer])

  const saveActiveAs = useCallback(async () => {
    if (!isEditableViewer(activeViewer)) {
      toast('Save as is for opened text files.')
      return
    }
    const dialog = await window.taskapp.saveDialog(activeViewer.path)
    if (dialog.canceled || !dialog.path) return
    await writeFileViewer(activeViewer, dialog.path)
  }, [activeViewer, toast, writeFileViewer])

  const updateViewerContent = useCallback((content: string) => {
    if (!activeViewerId) return
    setViewers((current) =>
      current.map((doc) =>
        doc.id === activeViewerId && isEditableViewer(doc) && doc.content !== content
          ? { ...doc, content, dirty: true }
          : doc
      )
    )
  }, [activeViewerId])

  const renameNote = useCallback(async (id: string, title: string) => {
    const current = notes.find((note) => note.id === id)
    const nextTitle = title.trim().slice(0, 80) || 'Untitled note'
    setRenamingId(null)
    if (current?.draft || draftIds.current.has(id)) {
      await persistDraft(id, nextTitle)
      return
    }
    if (current && current.title === nextTitle) return
    setNotes((currentNotes) =>
      currentNotes.map((note) => (note.id === id ? { ...note, title: nextTitle } : note))
    )
    const result = await window.taskapp.renameNote(id, nextTitle)
    if (!result.ok || !result.record) {
      toast(result.error || 'Could not rename the note.', 'error')
      if (current) {
        setNotes((currentNotes) =>
          currentNotes.map((note) => (note.id === id ? { ...note, title: current.title } : note))
        )
      }
      return
    }
    setNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === id ? { ...note, title: result.record!.title, updatedAt: result.record!.updatedAt } : note
      )
    )
  }, [notes, persistDraft, toast])

  const duplicateNote = useCallback(async (id: string) => {
    const source = notes.find((note) => note.id === id)
    if (!source) return
    const created = await window.taskapp.createNote(source.content, copyTitle(source.title, notes))
    const note: NoteDocument = { ...created.record, content: created.content, dirty: false }
    setNotes((current) => [note, ...current])
    setActiveNoteId(note.id)
    setActiveViewerId(null)
  }, [notes])

  const showNoteFile = useCallback(async (id: string) => {
    if (draftIds.current.has(id)) {
      toast('Name the note first to create its file.')
      return
    }
    const result = await window.taskapp.notePath(id)
    if (!result.ok || !result.path) {
      toast(result.error || 'Could not find that note.', 'error')
      return
    }
    await window.taskapp.showInFolder(result.path)
  }, [toast])

  const changeFont = useCallback((delta: number) => {
    const next = Math.min(22, Math.max(12, settings.fontSize + delta))
    void persistSettings({ ...settings, fontSize: next })
  }, [persistSettings, settings])

  const requestDelete = useCallback((id: string) => {
    setPendingDelete(id)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return
    const id = pendingDelete
    const timer = saveTimers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      saveTimers.current.delete(id)
    }
    if (!draftIds.current.has(id)) {
      await window.taskapp.deleteNote(id)
    }
    draftIds.current.delete(id)
    setPendingDelete(null)
    setNotes((current) => {
      const next = current.filter((note) => note.id !== id)
      if (activeNoteId === id) {
        setActiveNoteId(next[0]?.id ?? null)
      }
      return next
    })
  }, [activeNoteId, pendingDelete])

  const applyOpenResult = useCallback(async (result: OpenFileResult) => {
    if (!result.ok) {
      toast(result.error, 'error')
      return
    }

    if (result.kind === 'text') {
      const created = await window.taskapp.createNote(result.content, result.name.replace(/\.txt$/i, ''))
      const note: NoteDocument = { ...created.record, content: created.content, dirty: false }
      setNotes((current) => [note, ...current])
      setActiveNoteId(note.id)
      setActiveViewerId(null)
      toast(`Saved “${note.title}” to your notes.`)
      return
    }

    if (result.kind === 'json') {
      setViewers((current) => {
        const existing = current.find((doc) => doc.kind === 'json' && doc.path === result.path)
        if (existing) {
          setActiveViewerId(existing.id)
          setActiveNoteId(null)
          return current
        }
        const check = inspectJson(result.content)
        const next: JsonViewerDoc = {
          id: uid(),
          kind: 'json',
          path: result.path,
          name: result.name,
          mime: result.mime,
          content: check.formatted ?? result.content,
          dirty: false
        }
        setActiveViewerId(next.id)
        setActiveNoteId(null)
        return [...current, next]
      })
      return
    }

    if (result.kind === 'text-file') {
      setViewers((current) => {
        const existing = current.find((doc) => doc.kind === 'text-file' && doc.path === result.path)
        if (existing) {
          setActiveViewerId(existing.id)
          setActiveNoteId(null)
          return current
        }
        const next: TextFileViewerDoc = {
          id: uid(),
          kind: 'text-file',
          path: result.path,
          name: result.name,
          mime: result.mime,
          language: result.language,
          label: result.label,
          content: result.content,
          dirty: false
        }
        setActiveViewerId(next.id)
        setActiveNoteId(null)
        return [...current, next]
      })
      return
    }

    if (result.kind === 'image') {
      setViewers((current) => {
        const existing = current.find((doc) => doc.kind === 'image' && doc.path === result.path)
        if (existing) {
          setActiveViewerId(existing.id)
          setActiveNoteId(null)
          return current
        }
        const next: ImageViewerDoc = {
          id: uid(),
          kind: 'image',
          path: result.path,
          name: result.name,
          mime: result.mime,
          label: result.label,
          data: asBytes(result.data)
        }
        setActiveViewerId(next.id)
        setActiveNoteId(null)
        return [...current, next]
      })
      return
    }

    if (result.kind === 'audio') {
      setViewers((current) => {
        const existing = current.find((doc) => doc.kind === 'audio' && doc.path === result.path)
        if (existing) {
          setActiveViewerId(existing.id)
          setActiveNoteId(null)
          return current
        }
        const next: AudioViewerDoc = {
          id: uid(),
          kind: 'audio',
          path: result.path,
          name: result.name,
          mime: result.mime,
          label: result.label,
          data: asBytes(result.data)
        }
        setActiveViewerId(next.id)
        setActiveNoteId(null)
        return [...current, next]
      })
      return
    }

    setViewers((current) => {
      const existing = current.find((doc) => doc.kind === 'pdf' && doc.path === result.path)
      if (existing) {
        setActiveViewerId(existing.id)
        setActiveNoteId(null)
        return current
      }
      const next: PdfViewerDoc = {
        id: uid(),
        kind: 'pdf',
        path: result.path,
        name: result.name,
        mime: 'application/pdf',
        pdfData: asBytes(result.data)
      }
      setActiveViewerId(next.id)
      setActiveNoteId(null)
      return [...current, next]
    })
  }, [toast])

  const openPaths = useCallback(async (paths: string[]) => {
    for (const filePath of paths) {
      await applyOpenResult(await window.taskapp.openPath(filePath))
    }
    setSettings(await window.taskapp.getSettings())
  }, [applyOpenResult])

  const openFiles = useCallback(async () => {
    const dialog = await window.taskapp.openDialog()
    if (!dialog.canceled) await openPaths(dialog.paths)
  }, [openPaths])

  const closeViewer = useCallback((id: string) => {
    const doc = viewers.find((item) => item.id === id)
    void (async () => {
      if (isEditableViewer(doc) && doc.dirty) {
        const saved = await writeFileViewer(doc)
        if (!saved) return
      }
      setViewers((current) => {
        const next = current.filter((item) => item.id !== id)
        if (activeViewerId === id) {
          setActiveViewerId(next.at(-1)?.id ?? null)
          if (!next.length) {
            setActiveNoteId((currentNote) => currentNote ?? notes[0]?.id ?? null)
          }
        }
        return next
      })
    })()
  }, [activeViewerId, notes, viewers, writeFileViewer])

  const requestWindowClose = useCallback(() => {
    void flushAllDirty().then((ok) => {
      if (ok) window.taskapp.allowClose()
    })
  }, [flushAllDirty])

  const handleMenu = useCallback((command: MenuCommand) => {
    if (command === 'new') void newNote()
    if (command === 'open') void openFiles()
    if (command === 'save') void saveActive()
    if (command === 'save-as') void saveActiveAs()
    if (command === 'close' && activeViewer) closeViewer(activeViewer.id)
    if (command === 'rename' && activeNote) setTitleFocusKey((value) => value + 1)
    if (command === 'duplicate' && activeNote) void duplicateNote(activeNote.id)
    if (command === 'delete-note' && activeNote) requestDelete(activeNote.id)
    if (command === 'undo') runNoteEdit('undo')
    if (command === 'redo') runNoteEdit('redo')
    if (command === 'cut') runNoteEdit('cut')
    if (command === 'copy') runNoteEdit('copy')
    if (command === 'paste') runNoteEdit('paste')
    if (command === 'select-all') runNoteEdit('selectAll')
    if (command === 'find') window.dispatchEvent(new CustomEvent('taskapp:find'))
    if (command === 'replace') window.dispatchEvent(new CustomEvent('taskapp:replace'))
    if (command === 'goto-line') window.dispatchEvent(new CustomEvent('taskapp:goto-open'))
    if (command === 'toggle-preview') window.dispatchEvent(new CustomEvent('taskapp:preview'))
    if (command === 'command-palette') setPaletteOpen(true)
    if (command === 'settings') setSettingsOpen(true)
    if (command === 'shortcuts') setShortcutsOpen(true)
    if (command === 'toggle-theme') {
      void persistSettings({ ...settings, theme: nextTheme(theme) })
    }
    const chosen = themeFromCommand(command)
    if (chosen) void persistSettings({ ...settings, theme: chosen })
    if (command === 'toggle-wrap') {
      void persistSettings({ ...settings, wordWrap: !settings.wordWrap })
    }
    if (command === 'font-larger') changeFont(1)
    if (command === 'font-smaller') changeFont(-1)
    if (command === 'show-in-folder' && activeViewer) {
      void window.taskapp.showInFolder(activeViewer.path)
    }
    if (command === 'show-in-folder' && activeNote && !activeViewer) {
      void showNoteFile(activeNote.id)
    }
    if (command === 'show-notes-folder') {
      void window.taskapp.showNotesFolder()
    }
  }, [activeNote, activeViewer, changeFont, closeViewer, duplicateNote, newNote, openFiles, persistSettings, requestDelete, saveActive, saveActiveAs, settings, showNoteFile, theme])

  const sessionReady = useRef(false)

  useEffect(() => {
    let cancelled = false
    void Promise.all([window.taskapp.getSettings(), window.taskapp.listNotes()])
      .then(async ([loadedSettings, library]) => {
        if (cancelled) return
        const session = loadedSettings.session ?? emptySession
        setSettings({
          ...loadedSettings,
          theme: normalizeTheme(loadedSettings.theme),
          session
        })
        setNotesDir(library.dir)
        const loaded = library.notes.map((record) => ({
          ...record,
          content: library.contents[record.id] ?? '',
          dirty: false
        }))
        setNotes(loaded)
        const noteId = session.noteId && loaded.some((note) => note.id === session.noteId)
          ? session.noteId
          : loaded[0]?.id ?? null
        lastNoteId.current = noteId
        setActiveNoteId(session.activeFile ? null : noteId)
        if (session.files.length) {
          for (const filePath of session.files) {
            if (cancelled) return
            await applyOpenResult(await window.taskapp.openPath(filePath))
          }
          if (cancelled) return
          if (session.activeFile) {
            setViewers((current) => {
              const match = current.find((doc) => doc.path === session.activeFile)
              if (match) {
                setActiveViewerId(match.id)
                setActiveNoteId(null)
              }
              return current
            })
          } else if (noteId) {
            setActiveViewerId(null)
            setActiveNoteId(noteId)
          }
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) toast(error instanceof Error ? error.message : 'Could not load notes.', 'error')
      })
      .finally(() => {
        if (!cancelled) {
          sessionReady.current = true
          setReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [applyOpenResult, toast])

  useEffect(() => {
    if (activeNoteId) lastNoteId.current = activeNoteId
  }, [activeNoteId])

  useEffect(() => {
    if (!sessionReady.current) return
    const timer = window.setTimeout(() => {
      if (activeNoteId) lastNoteId.current = activeNoteId
      const session: EditorSession = {
        noteId: lastNoteId.current,
        files: viewers.map((doc) => doc.path),
        activeFile: activeViewer?.path ?? null
      }
      setSettings((current) => {
        const next = { ...current, session }
        void window.taskapp.setSettings(next)
        return next
      })
    }, 500)
    return () => window.clearTimeout(timer)
  }, [activeNoteId, activeViewer, viewers])

  useEffect(() => {
    const offMenu = window.taskapp.onMenuCommand(handleMenu)
    const offOpen = window.taskapp.onOpenPaths((paths) => {
      void openPaths(paths)
    })
    void window.taskapp.takePendingOpens().then((paths) => {
      if (paths.length) void openPaths(paths)
    })
    const offClose = window.taskapp.onCloseRequested(requestWindowClose)
    return () => {
      offMenu()
      offOpen()
      offClose()
    }
  }, [handleMenu, openPaths, requestWindowClose])

  useEffect(() => {
    const title = activeViewer
      ? `${isEditableViewer(activeViewer) && activeViewer.dirty ? '• ' : ''}${activeViewer.name} — Taskapp`
      : activeNote
        ? `${activeNote.dirty ? '• ' : ''}${activeNote.title} — Taskapp`
        : 'Taskapp'
    window.taskapp.setTitle(title)
  }, [activeNote, activeViewer])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const jsonState = useMemo(() => {
    if (activeViewer?.kind !== 'json') return null
    return inspectJson(activeViewer.content)
  }, [activeViewer])

  return {
    ready,
    settings,
    persistSettings,
    theme,
    notes,
    notesDir,
    viewers,
    activeNote,
    activeViewer,
    activeNoteId,
    activeViewerId,
    selectNote,
    setActiveViewerId: (id: string) => {
      setActiveViewerId(id)
      setActiveNoteId(null)
    },
    toasts,
    paletteOpen,
    setPaletteOpen,
    settingsOpen,
    setSettingsOpen,
    shortcutsOpen,
    setShortcutsOpen,
    pendingDelete,
    setPendingDelete,
    renamingId,
    setRenamingId,
    titleFocusKey,
    jsonState,
    newNote,
    openFiles,
    openPaths,
    saveActive,
    saveActiveAs,
    updateNoteContent,
    updateViewerContent,
    renameNote,
    duplicateNote,
    showNoteFile,
    requestDelete,
    confirmDelete,
    closeViewer,
    handleMenu
  }
}
