import Editor from '@monaco-editor/react'
import { useEffect, useRef, useState } from 'react'
import { findMatches, replaceAll, type CaretInfo } from '@shared/text'
import type { ThemePreference } from '@shared/types'
import { FindBar } from './FindBar'
import { emitCaret } from '../lib/caret'
import { bindMonaco } from '../lib/edit'
import { ensureMonacoThemes, monaco, monacoLanguage } from '../lib/monaco'

interface Props {
  value: string
  language: string
  theme: ThemePreference
  wordWrap: boolean
  fontSize: number
  onChange: (value: string) => void
}

export function CodeEditor({ value, language, theme, wordWrap, fontSize, onChange }: Props) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const findField = useRef<HTMLInputElement>(null)
  const [findOpen, setFindOpen] = useState(false)
  const [showReplace, setShowReplace] = useState(false)
  const [query, setQuery] = useState('')
  const [replace, setReplace] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [hit, setHit] = useState(0)
  const seenMatch = useRef(false)

  const hits = findMatches(value, query, caseSensitive, wholeWord)
  const matchLabel = !query ? '' : hits.length ? `${Math.min(hit + 1, hits.length)} of ${hits.length}` : 'No matches'

  const reportCaret = (editor: monaco.editor.IStandaloneCodeEditor) => {
    const model = editor.getModel()
    const selection = editor.getSelection()
    if (!model || !selection) return
    const start = selection.getStartPosition()
    const selected = model.getValueInRange(selection)
    const info: CaretInfo = {
      line: start.lineNumber,
      column: start.column,
      selected: selected.length,
      selectedWords: selected.trim() ? selected.trim().split(/\s+/).length : 0
    }
    emitCaret(info)
  }

  const reveal = (index: number) => {
    const editor = editorRef.current
    const model = editor?.getModel()
    if (!editor || !model || !hits.length || !query) return
    const next = (index + hits.length) % hits.length
    setHit(next)
    seenMatch.current = true
    const start = model.getPositionAt(hits[next])
    const end = model.getPositionAt(hits[next] + query.length)
    editor.setSelection({
      startLineNumber: start.lineNumber,
      startColumn: start.column,
      endLineNumber: end.lineNumber,
      endColumn: end.column
    })
    editor.revealRangeInCenter({
      startLineNumber: start.lineNumber,
      startColumn: start.column,
      endLineNumber: end.lineNumber,
      endColumn: end.column
    })
  }

  useEffect(() => {
    const open = (withReplace: boolean) => {
      const editor = editorRef.current
      const selected = editor?.getModel()?.getValueInRange(editor.getSelection()!) ?? ''
      if (selected && !selected.includes('\n') && selected.length < 120) setQuery(selected)
      setShowReplace(withReplace)
      setFindOpen(true)
      window.setTimeout(() => findField.current?.select(), 0)
    }
    const onFind = () => open(false)
    const onReplace = () => open(true)
    const onGoto = (event: Event) => {
      const detail = (event as CustomEvent<{ line: number; column: number }>).detail
      const editor = editorRef.current
      if (!detail || !editor) return
      editor.setPosition({ lineNumber: detail.line, column: detail.column })
      editor.revealPositionInCenter({ lineNumber: detail.line, column: detail.column })
      editor.focus()
    }
    window.addEventListener('taskapp:find', onFind)
    window.addEventListener('taskapp:replace', onReplace)
    window.addEventListener('taskapp:goto', onGoto)
    return () => {
      window.removeEventListener('taskapp:find', onFind)
      window.removeEventListener('taskapp:replace', onReplace)
      window.removeEventListener('taskapp:goto', onGoto)
    }
  }, [])

  useEffect(() => {
    setHit(0)
    seenMatch.current = false
  }, [query, caseSensitive, wholeWord, value])

  useEffect(() => {
    monaco.editor.setTheme(`taskapp-${theme}`)
  }, [theme])

  useEffect(() => {
    return () => {
      bindMonaco(null)
      emitCaret(null)
    }
  }, [])

  const replaceOne = () => {
    const editor = editorRef.current
    const model = editor?.getModel()
    if (!editor || !model || !query || !hits.length) return
    const current = hits[Math.min(hit, hits.length - 1)]
    const range = {
      start: model.getPositionAt(current),
      end: model.getPositionAt(current + query.length)
    }
    editor.executeEdits('replace', [
      {
        range: {
          startLineNumber: range.start.lineNumber,
          startColumn: range.start.column,
          endLineNumber: range.end.lineNumber,
          endColumn: range.end.column
        },
        text: replace
      }
    ])
  }

  const replaceEvery = () => {
    if (!query) return
    const result = replaceAll(value, query, replace, caseSensitive, wholeWord)
    if (result.count) onChange(result.next)
  }

  return (
    <div className="code-editor">
      {findOpen && (
        <FindBar
          query={query}
          replace={replace}
          caseSensitive={caseSensitive}
          wholeWord={wholeWord}
          showReplace={showReplace}
          matchLabel={matchLabel}
          findRef={findField}
          onQuery={setQuery}
          onReplaceValue={setReplace}
          onToggleCase={() => setCaseSensitive((value) => !value)}
          onToggleWord={() => setWholeWord((value) => !value)}
          onNext={() => reveal(seenMatch.current ? hit + 1 : hit)}
          onPrev={() => reveal(hit - 1)}
          onReplace={replaceOne}
          onReplaceAll={replaceEvery}
          onClose={() => {
            setFindOpen(false)
            editorRef.current?.focus()
          }}
        />
      )}
      <div className="code-editor-host">
        <Editor
          value={value}
          language={monacoLanguage(language)}
          theme={`taskapp-${theme}`}
          beforeMount={() => ensureMonacoThemes()}
          onMount={(editor) => {
            editorRef.current = editor
            bindMonaco(editor)
            reportCaret(editor)
            editor.onDidChangeCursorSelection(() => reportCaret(editor))
            editor.focus()
            editor.addAction({
              id: 'taskapp-find',
              label: 'Find',
              keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF],
              run: () => {
                window.dispatchEvent(new CustomEvent('taskapp:find'))
              }
            })
            editor.addAction({
              id: 'taskapp-replace',
              label: 'Replace',
              keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH],
              run: () => {
                window.dispatchEvent(new CustomEvent('taskapp:replace'))
              }
            })
            editor.addAction({
              id: 'taskapp-goto',
              label: 'Go to line',
              keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG],
              run: () => {
                window.dispatchEvent(new CustomEvent('taskapp:goto-open'))
              }
            })
          }}
          onChange={(next) => onChange(next ?? '')}
          options={{
            fontSize,
            fontFamily: '"IBM Plex Mono", "Ubuntu Mono", "Noto Sans Mono", ui-monospace, monospace',
            wordWrap: wordWrap ? 'on' : 'off',
            minimap: { enabled: false },
            padding: { top: 18, bottom: 28 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            renderLineHighlight: 'line',
            smoothScrolling: true,
            occurrencesHighlight: 'off',
            find: { addExtraSpaceOnTop: false }
          }}
        />
      </div>
    </div>
  )
}
