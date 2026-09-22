import icon from '../assets/icon.png'
import type { NoteDocument } from '@shared/types'

interface Props {
  notes: NoteDocument[]
  onNew: () => void
  onOpen: () => void
  onOpenNote: (id: string) => void
}

export function Welcome({ notes, onNew, onOpen, onOpenNote }: Props) {
  return (
    <div className="welcome">
      <div className="welcome-card">
        <div className="welcome-hero">
          <img src={icon} alt="Taskapp" />
          <div>
            <h1>Taskapp</h1>
            <p>Notes live as .txt files on this computer. Open Markdown, JSON, PDFs, images, and audio beside them — saved in place, never turned into notes.</p>
          </div>
        </div>
        <div className="welcome-actions">
          <button className="primary-btn" onClick={onNew}>New note</button>
          <button className="ghost-btn" onClick={onOpen}>Open a file</button>
        </div>
        <div className="recents">
          <h2>Notes on this computer</h2>
          {notes.length === 0 ? (
            <p className="empty-note">Start a note. It will still be here the next time you open Taskapp.</p>
          ) : (
            <div className="recent-list">
              {notes.map((note) => (
                <button key={note.id} className="recent-item" onClick={() => onOpenNote(note.id)}>
                  <span>
                    <strong>{note.title}</strong>
                    <em>{new Date(note.updatedAt).toLocaleString()}</em>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
