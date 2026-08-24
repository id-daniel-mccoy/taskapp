import { LANGUAGE_OPTIONS } from '@shared/mime'
import type { WorkspaceDocument } from '../hooks/useWorkspace'

interface Props {
  active: WorkspaceDocument | null
  wordWrap: boolean
  onLanguage: (language: string) => void
}

export function StatusBar({ active, wordWrap, onLanguage }: Props) {
  return (
    <footer className="status">
      <div className="status-left">
        <span>UTF-8</span>
        <span>{active ? active.mime : 'Ready'}</span>
        {active?.kind === 'text' && (
          <span>Ln {active.cursor.line}, Col {active.cursor.column}</span>
        )}
      </div>
      <div className="status-right">
        {active?.kind === 'text' && (
          <select value={active.language} onChange={(event) => onLanguage(event.target.value)}>
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
            {!LANGUAGE_OPTIONS.some((option) => option.id === active.language) && (
              <option value={active.language}>{active.label}</option>
            )}
          </select>
        )}
        <span>{active?.kind === 'pdf' ? 'Read only' : wordWrap ? 'Wrap' : 'No wrap'}</span>
        <span>{active?.label ?? 'Taskapp'}</span>
      </div>
    </footer>
  )
}
