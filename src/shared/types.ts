export type ThemePreference = 'light' | 'dark' | 'ocean-dream' | 'dark-forest' | 'purple-rain'
export type FileKind = 'text' | 'text-file' | 'json' | 'pdf' | 'image' | 'audio' | 'unsupported'
export type ViewerKind = 'json' | 'pdf' | 'image' | 'text-file' | 'audio'

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

export interface EditorSession {
  noteId: string | null
  files: string[]
  activeFile: string | null
}

export interface AppSettings {
  theme: ThemePreference
  wordWrap: boolean
  fontSize: number
  recents: RecentFile[]
  session: EditorSession
}

export interface Alarm {
  id: string
  enabled: boolean
  hour: number
  minute: number
  label: string
  days: number[]
  soundPath: string
  snoozeMinutes: number
  createdAt: number
  updatedAt: number
}

export interface AlarmSound {
  path: string
  name: string
  theme: string
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

export interface OpenAudioResult {
  ok: true
  kind: 'audio'
  path: string
  name: string
  mime: string
  language: 'audio'
  label: string
  data: Uint8Array
}

export interface OpenErrorResult {
  ok: false
  error: string
}

export type OpenFileResult = OpenTextResult | OpenJsonResult | OpenPdfResult | OpenTextFileResult | OpenImageResult | OpenAudioResult | OpenErrorResult

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
  | 'replace'
  | 'goto-line'
  | 'toggle-preview'
  | 'command-palette'
  | 'toggle-theme'
  | 'theme-light'
  | 'theme-dark'
  | 'theme-ocean-dream'
  | 'theme-dark-forest'
  | 'theme-purple-rain'
  | 'toggle-wrap'
  | 'font-larger'
  | 'font-smaller'
  | 'settings'
  | 'show-in-folder'
  | 'show-notes-folder'
  | 'shortcuts'
