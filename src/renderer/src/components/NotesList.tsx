import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { IconButton } from './IconButton'
import { IconPlus } from '../lib/icons'
import type { NoteDocument } from '@shared/types'

interface Props {
  notes: NoteDocument[]
  activeId: string | null
  renamingId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onRename: (id: string, title: string) => void
  onStartRename: (id: string) => void
  onCancelRename: () => void
  onDuplicate: (id: string) => void
  onShowFile: (id: string) => void
  onDelete: (id: string) => void
}

function createdLabel(createdAt: number): string {
  return new Date(createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

interface MenuState {
  x: number
  y: number
  noteId: string | null
}

export function NotesList({
  notes,
  activeId,
  renamingId,
  onSelect,
  onNew,
  onRename,
  onStartRename,
  onCancelRename,
  onDuplicate,
  onShowFile,
  onDelete
}: Props) {
  const [menu, setMenu] = useState<MenuState | null>(null)
  const renameField = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!renamingId) return
    const node = document.querySelector(`[data-note-id="${CSS.escape(renamingId)}"]`)
    if (node instanceof HTMLElement) node.scrollIntoView({ block: 'nearest' })
    renameField.current?.select()
  }, [renamingId])

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    window.addEventListener('click', close)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('resize', close)
    }
  }, [menu])

  const openMenu = (event: MouseEvent, noteId: string | null) => {
    event.preventDefault()
    event.stopPropagation()
    const width = 196
    const height = noteId ? 220 : 48
    setMenu({
      x: Math.min(event.clientX, window.innerWidth - width - 8),
      y: Math.min(event.clientY, window.innerHeight - height - 8),
      noteId
    })
  }

  return (
    <aside className="notes-list" onContextMenu={(event) => openMenu(event, null)}>
      <div className="notes-list-head">
        <h2>Notes</h2>
        <IconButton label="New note" onClick={onNew}>
          <IconPlus />
        </IconButton>
      </div>
      {notes.length === 0 ? (
        <p className="empty-note">No notes yet. Create one and it will be saved as a .txt file on this computer.</p>
      ) : (
        <div className="notes-list-body">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`note-item${note.id === activeId ? ' active' : ''}`}
              data-note-id={note.id}
              onContextMenu={(event) => openMenu(event, note.id)}
            >
              {renamingId === note.id ? (
                <input
                  ref={renameField}
                  className="note-rename"
                  defaultValue={note.title}
                  autoFocus
                  onClick={(event) => event.stopPropagation()}
                  onBlur={(event) => onRename(note.id, event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      onRename(note.id, event.currentTarget.value)
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault()
                      onCancelRename()
                    }
                  }}
                />
              ) : (
                <button
                  className="note-item-main"
                  onClick={() => onSelect(note.id)}
                  onDoubleClick={() => onStartRename(note.id)}
                >
                  <strong>{note.title}{note.dirty ? ' •' : ''}</strong>
                  <em>{createdLabel(note.createdAt)}</em>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {menu && (
        <div
          className="context-menu"
          style={{ left: menu.x, top: menu.y }}
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          {menu.noteId ? (
            <>
              <button onClick={() => { onSelect(menu.noteId!); onStartRename(menu.noteId!); setMenu(null) }}>Rename</button>
              <button onClick={() => { void onDuplicate(menu.noteId!); setMenu(null) }}>Duplicate</button>
              <button onClick={() => { void onShowFile(menu.noteId!); setMenu(null) }}>Show in folder</button>
              <hr />
              <button className="danger" onClick={() => { onDelete(menu.noteId!); setMenu(null) }}>Delete</button>
            </>
          ) : (
            <button onClick={() => { onNew(); setMenu(null) }}>New note</button>
          )}
        </div>
      )}
    </aside>
  )
}
