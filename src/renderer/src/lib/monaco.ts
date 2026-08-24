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

export function registerThemes(): void {
  monaco.editor.defineTheme('taskapp-ink', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6d7680', fontStyle: 'italic' },
      { token: 'string', foreground: 'd4a05a' },
      { token: 'keyword', foreground: 'd4676a' },
      { token: 'number', foreground: '7dba8a' }
    ],
    colors: {
      'editor.background': '#121820',
      'editor.foreground': '#ebe6dc',
      'editor.lineHighlightBackground': '#1c252e66',
      'editorCursor.foreground': '#d4a05a',
      'editorLineNumber.foreground': '#6d7680',
      'editorLineNumber.activeForeground': '#d4a05a',
      'editor.selectionBackground': '#d4a05a33',
      'editorWidget.background': '#1c252e',
      'editorWidget.border': '#2a3540',
      'scrollbarSlider.background': '#2a354088'
    }
  })

  monaco.editor.defineTheme('taskapp-paper', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '94897a', fontStyle: 'italic' },
      { token: 'string', foreground: '9a6b2f' },
      { token: 'keyword', foreground: 'b5443a' },
      { token: 'number', foreground: '3d7a4c' }
    ],
    colors: {
      'editor.background': '#fbf7f0',
      'editor.foreground': '#2a241c',
      'editor.lineHighlightBackground': '#efe8db80',
      'editorCursor.foreground': '#9a6b2f',
      'editorLineNumber.foreground': '#94897a',
      'editorLineNumber.activeForeground': '#9a6b2f',
      'editor.selectionBackground': '#9a6b2f26',
      'editorWidget.background': '#fffdf8',
      'editorWidget.border': '#d8ccb8'
    }
  })
}

export { monaco }
