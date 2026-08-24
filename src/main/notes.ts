import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { app } from 'electron'
import type { NoteRecord, NotesLibrary } from '../shared/types'

interface NotesIndex {
  notes: NoteRecord[]
}

const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function notesDir(): string {
  return join(app.getPath('userData'), 'notes')
}

function indexPath(): string {
  return join(notesDir(), 'index.json')
}

function noteFile(id: string): string {
  return join(notesDir(), `${id}.txt`)
}

export function notePath(id: string): string {
  assertNoteId(id)
  return noteFile(id)
}

function assertNoteId(id: string): void {
  if (!ID_PATTERN.test(id)) {
    throw new Error('Invalid note id.')
  }
}

function nextUntitled(notes: NoteRecord[]): string {
  const used = new Set(notes.map((note) => note.title))
  if (!used.has('Untitled note')) return 'Untitled note'
  let index = 2
  while (used.has(`Untitled note ${index}`)) index += 1
  return `Untitled note ${index}`
}

async function ensureLibrary(): Promise<void> {
  await mkdir(notesDir(), { recursive: true })
}

async function readIndex(): Promise<NotesIndex> {
  await ensureLibrary()
  try {
    const raw = await readFile(indexPath(), 'utf8')
    const parsed = JSON.parse(raw) as NotesIndex
    return { notes: Array.isArray(parsed.notes) ? parsed.notes : [] }
  } catch {
    return { notes: [] }
  }
}

async function writeIndex(index: NotesIndex): Promise<void> {
  await ensureLibrary()
  const temp = `${indexPath()}.tmp`
  await writeFile(temp, JSON.stringify(index, null, 2), 'utf8')
  await rename(temp, indexPath())
}

export async function loadLibrary(): Promise<NotesLibrary> {
  const index = await readIndex()
  const contents: Record<string, string> = {}
  const notes: NoteRecord[] = []

  for (const record of index.notes) {
    try {
      assertNoteId(record.id)
      contents[record.id] = await readFile(noteFile(record.id), 'utf8')
      notes.push(record)
    } catch {
      // Skip notes whose files were moved or deleted outside the app.
    }
  }

  if (notes.length !== index.notes.length) {
    await writeIndex({ notes })
  }

  return { dir: notesDir(), notes, contents }
}

export async function createNote(content = '', titleHint?: string, idHint?: string): Promise<{ record: NoteRecord; content: string }> {
  const index = await readIndex()
  let id = idHint && ID_PATTERN.test(idHint) ? idHint : crypto.randomUUID()
  if (index.notes.some((note) => note.id === id)) id = crypto.randomUUID()
  const title = titleHint?.trim().slice(0, 80) || nextUntitled(index.notes)
  const now = Date.now()
  const record: NoteRecord = { id, title, createdAt: now, updatedAt: now }
  await writeFile(noteFile(id), content, 'utf8')
  index.notes.unshift(record)
  await writeIndex(index)
  return { record, content }
}

export async function writeNote(id: string, content: string): Promise<NoteRecord> {
  assertNoteId(id)
  const index = await readIndex()
  const current = index.notes.find((note) => note.id === id)
  if (!current) throw new Error('That note no longer exists.')
  current.updatedAt = Date.now()
  await writeFile(noteFile(id), content, 'utf8')
  await writeIndex(index)
  return current
}

export async function renameNote(id: string, title: string): Promise<NoteRecord> {
  assertNoteId(id)
  const index = await readIndex()
  const current = index.notes.find((note) => note.id === id)
  if (!current) throw new Error('That note no longer exists.')
  current.title = title.trim().slice(0, 80) || 'Untitled note'
  current.updatedAt = Date.now()
  await writeIndex(index)
  return current
}

export async function deleteNote(id: string): Promise<void> {
  assertNoteId(id)
  const index = await readIndex()
  index.notes = index.notes.filter((note) => note.id !== id)
  await writeIndex(index)
  try {
    await unlink(noteFile(id))
  } catch {
    // The index is the source of truth if the file is already gone.
  }
}

export function isPlainTextNote(filePath: string, mime: string): boolean {
  const name = filePath.split(/[\\/]/).pop()?.toLowerCase() ?? ''
  return mime === 'text/plain' || name.endsWith('.txt') || name.endsWith('.text')
}
