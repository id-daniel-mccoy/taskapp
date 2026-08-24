import { useEffect, useRef, useState } from 'react'
import type { NoteDocument } from '@shared/types'
import { runNoteEdit } from '../lib/edit'
import { IconButton } from './IconButton'
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
  IconWrap,
  IconX
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
  const [query, setQuery] = useState('')

  useEffect(() => {
    const node = field.current
    if (!node) return
    const active = document.activeElement
    if (active instanceof HTMLInputElement) return
    node.focus()
  }, [note.id])

  useEffect(() => {
    const onFind = () => {
      setFindOpen(true)
      window.setTimeout(() => findField.current?.select(), 0)
    }
    const onFocus = () => field.current?.focus()
    window.addEventListener('taskapp:find', onFind)
    window.addEventListener('taskapp:focus-editor', onFocus)
    return () => {
      window.removeEventListener('taskapp:find', onFind)
      window.removeEventListener('taskapp:focus-editor', onFocus)
    }
  }, [])

  const findNext = () => {
    const node = field.current
    const needle = query
    if (!node || !needle) return
    const start = node.selectionEnd === node.selectionStart ? node.selectionEnd : node.selectionEnd
    const haystack = node.value
    let index = haystack.indexOf(needle, start)
    if (index < 0) index = haystack.indexOf(needle, 0)
    if (index < 0) return
    node.focus()
    node.setSelectionRange(index, index + needle.length)
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
        <form
          className="find-bar"
          onSubmit={(event) => {
            event.preventDefault()
            findNext()
          }}
        >
          <input
            ref={findField}
            value={query}
            placeholder="Find in note"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setFindOpen(false)
                field.current?.focus()
              }
            }}
          />
          <button type="submit" className="chip-btn">Find next</button>
          <IconButton label="Close find" onClick={() => { setFindOpen(false); field.current?.focus() }}>
            <IconX />
          </IconButton>
        </form>
      )}
      <textarea
        ref={field}
        className="note-editor"
        value={note.content}
        onChange={(event) => onChange(event.target.value)}
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
