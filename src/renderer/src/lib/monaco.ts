import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

const monacoScope = globalThis as typeof globalThis & {
  MonacoEnvironment?: { getWorker: (_workerId: string, label: string) => Worker }
}

monacoScope.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new jsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
    if (label === 'typescript' || label === 'javascript') return new tsWorker()
    return new editorWorker()
  }
}

loader.config({ monaco })

function defineTheme(
  id: string,
  scheme: 'light' | 'dark',
  colors: { well: string; text: string; raised: string; border: string; accent: string; faint: string; danger: string; ok: string }
): void {
  monaco.editor.defineTheme(`taskapp-${id}`, {
    base: scheme === 'dark' ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: colors.faint.replace('#', ''), fontStyle: 'italic' },
      { token: 'string', foreground: colors.accent.replace('#', '') },
      { token: 'keyword', foreground: colors.danger.replace('#', '') },
      { token: 'number', foreground: colors.ok.replace('#', '') }
    ],
    colors: {
      'editor.background': colors.well,
      'editor.foreground': colors.text,
      'editor.lineHighlightBackground': `${colors.raised}66`,
      'editorCursor.foreground': colors.accent,
      'editorLineNumber.foreground': colors.faint,
      'editorLineNumber.activeForeground': colors.accent,
      'editor.selectionBackground': `${colors.accent}33`,
      'editorWidget.background': colors.raised,
      'editorWidget.border': colors.border,
      'scrollbarSlider.background': `${colors.border}88`
    }
  })
}

export function registerThemes(): void {
  defineTheme('dark', 'dark', {
    well: '#121820',
    text: '#ebe6dc',
    raised: '#1c252e',
    border: '#2a3540',
    accent: '#e2ac4a',
    faint: '#6d7680',
    danger: '#e07074',
    ok: '#7fc992'
  })
  defineTheme('light', 'light', {
    well: '#eef1f4',
    text: '#1a2128',
    raised: '#ffffff',
    border: '#d0dae4',
    accent: '#2f86b3',
    faint: '#8094a4',
    danger: '#c2473c',
    ok: '#2f8f4e'
  })
  defineTheme('ocean-dream', 'light', {
    well: '#d5f0f4',
    text: '#143841',
    raised: '#ffffff',
    border: '#a8d5de',
    accent: '#0ea3b8',
    faint: '#6ea8b3',
    danger: '#d05656',
    ok: '#1c9d78'
  })
  defineTheme('dark-forest', 'dark', {
    well: '#101810',
    text: '#e3f0d4',
    raised: '#1e2d23',
    border: '#314c38',
    accent: '#8fd45a',
    faint: '#6b8a6c',
    danger: '#e07d68',
    ok: '#8fd45a'
  })
  defineTheme('purple-rain', 'dark', {
    well: '#120e18',
    text: '#f3e9fb',
    raised: '#271f34',
    border: '#433056',
    accent: '#d48ef2',
    faint: '#8b74a8',
    danger: '#e86e96',
    ok: '#7ed9bc'
  })
}

let registered = false

export function ensureMonacoThemes(): void {
  if (registered) return
  registerThemes()
  registered = true
}

const KNOWN = new Set([
  'plaintext',
  'markdown',
  'json',
  'html',
  'css',
  'scss',
  'less',
  'javascript',
  'typescript',
  'xml',
  'yaml',
  'python',
  'shell',
  'sql',
  'rust',
  'go',
  'java',
  'c',
  'cpp',
  'ruby',
  'php',
  'ini'
])

export function monacoLanguage(language: string): string {
  return KNOWN.has(language) ? language : 'plaintext'
}

export { monaco }
