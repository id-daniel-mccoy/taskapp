import Editor, { type OnMount } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'
import type { editor } from 'monaco-editor'
import { registerThemes } from '../lib/monaco'
import type { WorkspaceDocument } from '../hooks/useWorkspace'
import { JsonBar } from './JsonBar'
import type { JsonCheck } from '../lib/json'

interface Props {
  doc: WorkspaceDocument
  theme: 'ink' | 'paper'
  wordWrap: boolean
  fontSize: number
  jsonState: JsonCheck | null
  onChange: (value: string) => void
  onCursor: (line: number, column: number) => void
  onFormat: () => void
  onMinify: () => void
  onValidate: () => void
}

export function TextEditor({
  doc,
  theme,
  wordWrap,
  fontSize,
  jsonState,
  onChange,
  onCursor,
  onFormat,
  onMinify,
  onValidate
}: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const handleMount: OnMount = (instance, monaco) => {
    editorRef.current = instance
    registerThemes()
    monaco.editor.setTheme(theme === 'ink' ? 'taskapp-ink' : 'taskapp-paper')
    instance.onDidChangeCursorPosition((event) => {
      onCursor(event.position.lineNumber, event.position.column)
    })
  }

  useEffect(() => {
    const onFind = () => editorRef.current?.getAction('actions.find')?.run()
    window.addEventListener('taskapp:find', onFind)
    return () => window.removeEventListener('taskapp:find', onFind)
  }, [])

  return (
    <div className="editor-host">
      {jsonState && (
        <JsonBar state={jsonState} onFormat={onFormat} onMinify={onMinify} onValidate={onValidate} />
      )}
      <Editor
        path={doc.path ?? doc.id}
        value={doc.content}
        language={doc.language}
        theme={theme === 'ink' ? 'taskapp-ink' : 'taskapp-paper'}
        onChange={(value) => onChange(value ?? '')}
        onMount={handleMount}
        options={{
          fontSize,
          fontFamily: 'IBM Plex Mono, Ubuntu Mono, Noto Sans Mono, ui-monospace, monospace',
          fontLigatures: true,
          wordWrap: wordWrap ? 'on' : 'off',
          minimap: { enabled: false },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          padding: { top: 18, bottom: 18 },
          renderLineHighlight: 'line',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          bracketPairColorization: { enabled: true },
          readOnly: false
        }}
      />
    </div>
  )
}
