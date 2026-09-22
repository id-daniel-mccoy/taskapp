import type { NoteDocument } from '@shared/types'
import type { ViewerDoc } from '../hooks/useWorkspace'

interface Props {
  note: NoteDocument | null
  viewer: ViewerDoc | null
  wordWrap: boolean
  saving: boolean
  statusHint?: string | null
  modeLabel?: string
}

function viewerLabel(kind: ViewerDoc['kind']): string {
  if (kind === 'text-file') return 'TEXT'
  if (kind === 'image') return 'IMAGE'
  if (kind === 'audio') return 'AUDIO'
  return kind.toUpperCase()
}

export function StatusBar({ note, viewer, wordWrap, saving, statusHint, modeLabel }: Props) {
  const words = note ? note.content.trim().split(/\s+/).filter(Boolean).length : 0
  return (
    <footer className="status">
      <div className="status-left">
        <span>UTF-8</span>
        {note && <span>Plain text note</span>}
        {viewer && <span>{viewer.mime}</span>}
        {note && <span>{words} {words === 1 ? 'word' : 'words'}</span>}
        {statusHint && <span>{statusHint}</span>}
      </div>
      <div className="status-right">
        {note && <span>{note.draft ? 'Name the note to save it' : saving ? 'Saving…' : 'Saved locally'}</span>}
        {viewer && (
          <span>
            {viewer.kind === 'pdf' || viewer.kind === 'image' || viewer.kind === 'audio'
              ? 'Read only'
              : 'dirty' in viewer && viewer.dirty
                ? 'Unsaved'
                : 'Saved'}
          </span>
        )}
        <span>{note ? (wordWrap ? 'Wrap' : 'No wrap') : viewer ? viewerLabel(viewer.kind) : modeLabel ?? 'Taskapp'}</span>
      </div>
    </footer>
  )
}
