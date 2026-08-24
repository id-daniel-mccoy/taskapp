import type { NoteDocument } from '@shared/types'
import type { ViewerDoc } from '../hooks/useWorkspace'

interface Props {
  note: NoteDocument | null
  viewer: ViewerDoc | null
  wordWrap: boolean
  saving: boolean
}

function viewerLabel(kind: ViewerDoc['kind']): string {
  if (kind === 'text-file') return 'TEXT'
  if (kind === 'image') return 'IMAGE'
  return kind.toUpperCase()
}

export function StatusBar({ note, viewer, wordWrap, saving }: Props) {
  const words = note ? note.content.trim().split(/\s+/).filter(Boolean).length : 0
  return (
    <footer className="status">
      <div className="status-left">
        <span>UTF-8</span>
        {note && <span>Plain text note</span>}
        {viewer && <span>{viewer.mime}</span>}
        {note && <span>{words} {words === 1 ? 'word' : 'words'}</span>}
      </div>
      <div className="status-right">
        {note && <span>{note.draft ? 'Name the note to save it' : saving ? 'Saving…' : 'Saved locally'}</span>}
        {viewer && (
          <span>
            {viewer.kind === 'pdf' || viewer.kind === 'image'
              ? 'Read only'
              : 'dirty' in viewer && viewer.dirty
                ? 'Unsaved'
                : 'Saved'}
          </span>
        )}
        <span>{note ? (wordWrap ? 'Wrap' : 'No wrap') : viewer ? viewerLabel(viewer.kind) : 'Taskapp'}</span>
      </div>
    </footer>
  )
}
