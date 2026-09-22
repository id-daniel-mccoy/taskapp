import { useEffect, useRef, useState } from 'react'
import type { NoteDocument } from '@shared/types'
import { findMatches, offsetFromLineColumn, replaceAll } from '@shared/text'
import { FindBar } from './FindBar'
import { IconButton } from './IconButton'
import { caretFromTextarea, emitCaret, indentTextarea, setTextareaValue } from '../lib/caret'
import { runNoteEdit } from '../lib/edit'
import {
  IconCopy,
  IconCut,
  IconFontLarger,
  IconFontSmaller,
  IconPaste,
  IconRedo,
  IconSearch,
  IconSelectAll,
  IconUndo,
  IconWrap
} from '../lib/icons'

interface Props {
  note: NoteDocument
  wordWrap: boolean
  fontSize: number
  onChange: (value: string) => void
  onCommand: (command: 'toggle-wrap' | 'font-larger' | 'font-smaller' | 'find') => void
}

export function NoteEditor({ note, wordWrap, fontSize, onChange, onCommand }: Props) {
  const field = useRef<HTMLTextAreaElement>(null)
  const findField = useRef<HTMLInputElement>(null)
  const [findOpen, setFindOpen] = useState(false)
  const [showReplace, setShowReplace] = useState(false)
  const [query, setQuery] = useState('')
  const [replace, setReplace] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [hit, setHit] = useState(0)
  const seenMatch = useRef(false)

  const hits = findMatches(note.content, query, caseSensitive, wholeWord)
  const matchLabel = !query ? '' : hits.length ? `${Math.min(hit + 1, hits.length)} of ${hits.length}` : 'No matches'

  const report = () => {
    if (field.current) emitCaret(caretFromTextarea(field.current))
  }

  const openFind = (withReplace: boolean) => {
    const node = field.current
    if (node) {
      const selected = node.value.slice(node.selectionStart, node.selectionEnd)
      if (selected && !selected.includes('\n') && selected.length < 120) setQuery(selected)
    }
    setShowReplace(withReplace)
    setFindOpen(true)
    window.setTimeout(() => findField.current?.select(), 0)
  }

  useEffect(() => {
    const node = field.current
    if (!node) return
    const active = document.activeElement
    if (active instanceof HTMLInputElement) return
    node.focus()
    report()
  }, [note.id])

  useEffect(() => {
    const onFind = () => openFind(false)
    const onReplace = () => openFind(true)
    const onFocus = () => field.current?.focus()
    const onGoto = (event: Event) => {
      const detail = (event as CustomEvent<{ line: number; column: number }>).detail
      const node = field.current
      if (!detail || !node) return
      const offset = offsetFromLineColumn(node.value, detail.line, detail.column)
      node.focus()
      node.setSelectionRange(offset, offset)
      report()
    }
    window.addEventListener('taskapp:find', onFind)
    window.addEventListener('taskapp:replace', onReplace)
    window.addEventListener('taskapp:focus-editor', onFocus)
    window.addEventListener('taskapp:goto', onGoto)
    return () => {
      window.removeEventListener('taskapp:find', onFind)
      window.removeEventListener('taskapp:replace', onReplace)
      window.removeEventListener('taskapp:focus-editor', onFocus)
      window.removeEventListener('taskapp:goto', onGoto)
    }
  }, [])

  useEffect(() => {
    setHit(0)
    seenMatch.current = false
  }, [query, caseSensitive, wholeWord, note.content])

  useEffect(() => () => emitCaret(null), [])

  const reveal = (index: number) => {
    const node = field.current
    if (!node || !query || !hits.length) return
    const next = (index + hits.length) % hits.length
    setHit(next)
    seenMatch.current = true
    node.focus()
    node.setSelectionRange(hits[next], hits[next] + query.length)
    report()
  }

  const replaceOne = () => {
    const node = field.current
    if (!node || !query || !hits.length) return
    const current = hits[Math.min(hit, hits.length - 1)]
    const next = node.value.slice(0, current) + replace + node.value.slice(current + query.length)
    const caret = current + replace.length
    setTextareaValue(node, next, caret)
  }

  const replaceEvery = () => {
    const node = field.current
    if (!node || !query) return
    const result = replaceAll(node.value, query, replace, caseSensitive, wholeWord)
    if (!result.count) return
    setTextareaValue(node, result.next, node.selectionStart)
  }

  return (
    <div className="note-pane">
      <div className="note-toolbar">
        <IconButton label="Undo" onClick={() => runNoteEdit('undo')}><IconUndo /></IconButton>
        <IconButton label="Redo" onClick={() => runNoteEdit('redo')}><IconRedo /></IconButton>
        <span className="toolbar-rule" />
        <IconButton label="Cut" onClick={() => runNoteEdit('cut')}><IconCut /></IconButton>
        <IconButton label="Copy" onClick={() => runNoteEdit('copy')}><IconCopy /></IconButton>
        <IconButton label="Paste" onClick={() => runNoteEdit('paste')}><IconPaste /></IconButton>
        <IconButton label="Select all" onClick={() => runNoteEdit('selectAll')}><IconSelectAll /></IconButton>
        <span className="toolbar-rule" />
        <IconButton label="Find" onClick={() => onCommand('find')}><IconSearch /></IconButton>
        <IconButton label="Word wrap" active={wordWrap} onClick={() => onCommand('toggle-wrap')}><IconWrap /></IconButton>
        <IconButton label="Smaller text" onClick={() => onCommand('font-smaller')}><IconFontSmaller /></IconButton>
        <IconButton label="Larger text" onClick={() => onCommand('font-larger')}><IconFontLarger /></IconButton>
      </div>
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
            field.current?.focus()
          }}
        />
      )}
      <textarea
        ref={field}
        className="note-editor"
        value={note.content}
        onChange={(event) => onChange(event.target.value)}
        onSelect={report}
        onKeyUp={report}
        onClick={report}
        onKeyDown={(event) => {
          if (event.key === 'Tab') {
            event.preventDefault()
            indentTextarea(event.currentTarget, event.shiftKey)
            report()
          }
        }}
        placeholder="Start writing…"
        spellCheck
        autoCorrect="on"
        autoCapitalize="sentences"
        wrap={wordWrap ? 'soft' : 'off'}
        style={{ fontSize: `${fontSize}px`, whiteSpace: wordWrap ? 'pre-wrap' : 'pre' }}
      />
    </div>
  )
}
