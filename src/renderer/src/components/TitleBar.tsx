import { useEffect, useRef, useState } from 'react'
import icon from '../assets/icon.png'
import { IconButton } from './IconButton'
import { IconFolder, IconMax, IconMin, IconMoon, IconPlus, IconSave, IconSearch, IconSettings, IconSun, IconX } from '../lib/icons'
import type { NoteDocument } from '@shared/types'
import type { ViewerDoc } from '../hooks/useWorkspace'

interface Props {
  note: NoteDocument | null
  viewer: ViewerDoc | null
  theme: 'ink' | 'paper'
  titleFocusKey: number
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onPalette: () => void
  onTheme: () => void
  onSettings: () => void
  onRename: (title: string) => void
}

export function TitleBar({
  note,
  viewer,
  theme,
  titleFocusKey,
  onNew,
  onOpen,
  onSave,
  onPalette,
  onTheme,
  onSettings,
  onRename
}: Props) {
  const titleField = useRef<HTMLInputElement>(null)
  const ignoreBlur = useRef(false)
  const [title, setTitle] = useState(note?.title ?? '')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    setTitle(note?.title ?? '')
    setEditing(false)
  }, [note?.id])

  useEffect(() => {
    if (!editing) setTitle(note?.title ?? '')
  }, [editing, note?.title])

  useEffect(() => {
    if (!titleFocusKey) return
    setEditing(true)
  }, [titleFocusKey])

  useEffect(() => {
    if (!editing) return
    const field = titleField.current
    if (!field) return
    field.focus()
    field.select()
  }, [editing])

  const commitTitle = () => {
    if (!note) return
    const next = title.trim().slice(0, 80) || 'Untitled note'
    setTitle(next)
    setEditing(false)
    onRename(next)
  }

  return (
    <header className="titlebar">
      <div className="titlebar-brand">
        <img src={icon} alt="" />
      </div>
      <div className="titlebar-center">
        {note && !viewer && editing ? (
          <div className="titlebar-title-row">
            {note.dirty && <span className="titlebar-dirty" aria-hidden>•</span>}
            <input
              id="note-title-field"
              ref={titleField}
              className="titlebar-name"
              value={title}
              aria-label="Note name"
              placeholder="Name this note"
              onChange={(event) => setTitle(event.target.value)}
              onBlur={() => {
                if (ignoreBlur.current) {
                  ignoreBlur.current = false
                  setEditing(false)
                  return
                }
                commitTitle()
              }}
              onMouseDown={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  event.currentTarget.blur()
                  window.dispatchEvent(new Event('taskapp:focus-editor'))
                }
                if (event.key === 'Escape') {
                  event.preventDefault()
                  ignoreBlur.current = true
                  const next = note.title.trim() || 'Untitled note'
                  setTitle(next)
                  setEditing(false)
                  if (note.draft) onRename(next)
                  window.dispatchEvent(new Event('taskapp:focus-editor'))
                }
              }}
            />
          </div>
        ) : note && !viewer ? (
          <div className="titlebar-title-row">
            {note.dirty && <span className="titlebar-dirty" aria-hidden>•</span>}
            <div
              className="titlebar-name is-static"
              title="Double-click to rename"
              onDoubleClick={() => setEditing(true)}
            >
              {note.title || 'Untitled note'}
            </div>
          </div>
        ) : (
          <div className="titlebar-name is-static">
            {viewer ? viewer.name : 'Taskapp'}
          </div>
        )}
      </div>
      <div className="titlebar-actions">
        <IconButton label="New note" onClick={onNew}><IconPlus /></IconButton>
        <IconButton label="Open JSON or PDF" onClick={onOpen}><IconFolder /></IconButton>
        <IconButton label="Save note" onClick={onSave}><IconSave /></IconButton>
        <IconButton label="Command palette" onClick={onPalette}><IconSearch /></IconButton>
        <IconButton label="Toggle theme" onClick={onTheme}>
          {theme === 'ink' ? <IconSun /> : <IconMoon />}
        </IconButton>
        <IconButton label="Settings" onClick={onSettings}><IconSettings /></IconButton>
        <div className="window-controls">
          <button type="button" className="window-btn has-tooltip has-tooltip-end" data-tooltip="Minimize" aria-label="Minimize" onClick={() => window.taskapp.minimize()}><IconMin /></button>
          <button type="button" className="window-btn has-tooltip has-tooltip-end" data-tooltip="Maximize" aria-label="Maximize" onClick={() => window.taskapp.maximize()}><IconMax /></button>
          <button type="button" className="window-btn close has-tooltip has-tooltip-end" data-tooltip="Close" aria-label="Close" onClick={() => window.taskapp.close()}><IconX /></button>
        </div>
      </div>
    </header>
  )
}
