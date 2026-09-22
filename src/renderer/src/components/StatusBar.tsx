import type { CaretInfo } from '@shared/text'
import type { NoteDocument } from '@shared/types'
import type { ViewerDoc } from '../hooks/useWorkspace'

interface Props {
  note: NoteDocument | null
  viewer: ViewerDoc | null
  wordWrap: boolean
  saving: boolean
  caret: CaretInfo | null
  statusHint?: string | null
  modeLabel?: string
  onGoto?: () => void
}

function viewerLabel(kind: ViewerDoc['kind']): string {
  if (kind === 'text-file') return 'TEXT'
  if (kind === 'image') return 'IMAGE'
  if (kind === 'audio') return 'AUDIO'
  return kind.toUpperCase()
}

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length
}

export function StatusBar({ note, viewer, wordWrap, saving, caret, statusHint, modeLabel, onGoto }: Props) {
  const words = note ? countWords(note.content) : viewer && 'content' in viewer ? countWords(viewer.content) : 0
  const showWords = Boolean(note || (viewer && 'content' in viewer))
  return (
    <footer className="status">
      <div className="status-left">
        <span>UTF-8</span>
        {note && <span>Plain text note</span>}
        {viewer && <span>{viewer.mime}</span>}
        {showWords && <span>{words} {words === 1 ? 'word' : 'words'}</span>}
        {caret && caret.selected > 0 && (
          <span>
            {caret.selected} selected
            {caret.selectedWords ? ` · ${caret.selectedWords} ${caret.selectedWords === 1 ? 'word' : 'words'}` : ''}
          </span>
        )}
        {statusHint && <span>{statusHint}</span>}
      </div>
      <div className="status-right">
        {caret && (note || (viewer && 'content' in viewer)) && (
          <button type="button" className="status-goto" onClick={onGoto} title="Go to line">
            Ln {caret.line}, Col {caret.column}
          </button>
        )}
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
