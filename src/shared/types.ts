export type ThemePreference = 'ink' | 'paper' | 'system'
export type FileKind = 'text' | 'text-file' | 'json' | 'pdf' | 'image' | 'unsupported'
export type ViewerKind = 'json' | 'pdf' | 'image' | 'text-file'

export interface FileTypeInfo {
  mime: string
  language: string
  kind: FileKind
  label: string
}

export interface RecentFile {
  path: string
  name: string
  mime: string
  openedAt: number
}

export interface AppSettings {
  theme: ThemePreference
  wordWrap: boolean
  fontSize: number
  recents: RecentFile[]
}

export interface NoteRecord {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

export interface NoteDocument extends NoteRecord {
  content: string
  dirty: boolean
  draft?: boolean
}

export interface OpenTextResult {
  ok: true
  kind: 'text'
  path: string
  name: string
  mime: string
  language: string
  label: string
  content: string
}

export interface OpenJsonResult {
  ok: true
  kind: 'json'
  path: string
  name: string
  mime: string
  language: 'json'
  label: string
  content: string
}

export interface OpenPdfResult {
  ok: true
  kind: 'pdf'
  path: string
  name: string
  mime: 'application/pdf'
  language: 'pdf'
  label: string
  data: Uint8Array
}

export interface OpenTextFileResult {
  ok: true
  kind: 'text-file'
  path: string
  name: string
  mime: string
  language: string
  label: string
  content: string
}

export interface OpenImageResult {
  ok: true
  kind: 'image'
  path: string
  name: string
  mime: string
  language: 'image'
  label: string
  data: Uint8Array
}

export interface OpenErrorResult {
  ok: false
  error: string
}

export type OpenFileResult = OpenTextResult | OpenJsonResult | OpenPdfResult | OpenTextFileResult | OpenImageResult | OpenErrorResult

export interface WriteFileResult {
  ok: boolean
  error?: string
}

export interface NotesLibrary {
  dir: string
  notes: NoteRecord[]
  contents: Record<string, string>
}

export type MenuCommand =
  | 'new'
  | 'open'
  | 'save'
  | 'save-as'
  | 'close'
  | 'rename'
  | 'duplicate'
  | 'delete-note'
  | 'undo'
  | 'redo'
  | 'cut'
  | 'copy'
  | 'paste'
  | 'select-all'
  | 'find'
  | 'command-palette'
  | 'toggle-theme'
  | 'toggle-wrap'
  | 'font-larger'
  | 'font-smaller'
  | 'settings'
  | 'show-in-folder'
  | 'show-notes-folder'
  | 'shortcuts'
