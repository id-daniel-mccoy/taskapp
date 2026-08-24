export type ThemePreference = 'ink' | 'paper' | 'system'
export type DocumentKind = 'text' | 'pdf'
export type FileKind = 'text' | 'pdf' | 'unsupported'

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

export interface OpenErrorResult {
  ok: false
  error: string
}

export type OpenFileResult = OpenTextResult | OpenPdfResult | OpenErrorResult

export interface WriteFileResult {
  ok: boolean
  error?: string
}

export interface SaveDialogResult {
  canceled: boolean
  path?: string
}

export interface OpenDialogResult {
  canceled: boolean
  paths: string[]
}

export type MenuCommand =
  | 'new'
  | 'open'
  | 'save'
  | 'save-as'
  | 'close'
  | 'find'
  | 'command-palette'
  | 'toggle-theme'
  | 'toggle-wrap'
  | 'settings'
  | 'format-json'
  | 'minify-json'
  | 'validate-json'
  | 'show-in-folder'
  | 'shortcuts'
