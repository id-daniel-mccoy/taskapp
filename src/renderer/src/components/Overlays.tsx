import { useEffect, useMemo, useState } from 'react'
import { THEMES, normalizeTheme } from '@shared/themes'
import type { AppSettings, MenuCommand, ThemePreference } from '@shared/types'

interface Command {
  id: MenuCommand
  label: string
  shortcut?: string
  group: 'File' | 'Edit' | 'View'
}

const COMMANDS: Command[] = [
  { id: 'command-palette', label: 'Command palette', shortcut: 'Ctrl+K', group: 'View' },
  { id: 'new', label: 'New note', shortcut: 'Ctrl+N', group: 'File' },
  { id: 'save', label: 'Save', shortcut: 'Ctrl+S', group: 'File' },
  { id: 'save-as', label: 'Save as…', shortcut: 'Ctrl+Shift+S', group: 'File' },
  { id: 'rename', label: 'Rename note', shortcut: 'F2', group: 'File' },
  { id: 'duplicate', label: 'Duplicate note', group: 'File' },
  { id: 'delete-note', label: 'Delete note', group: 'File' },
  { id: 'open', label: 'Open a file', shortcut: 'Ctrl+O', group: 'File' },
  { id: 'close', label: 'Close viewer', shortcut: 'Ctrl+W', group: 'File' },
  { id: 'show-in-folder', label: 'Show in folder', group: 'File' },
  { id: 'show-notes-folder', label: 'Show notes folder', group: 'File' },
  { id: 'undo', label: 'Undo', shortcut: 'Ctrl+Z', group: 'Edit' },
  { id: 'redo', label: 'Redo', shortcut: 'Ctrl+Shift+Z', group: 'Edit' },
  { id: 'cut', label: 'Cut', shortcut: 'Ctrl+X', group: 'Edit' },
  { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C', group: 'Edit' },
  { id: 'paste', label: 'Paste', shortcut: 'Ctrl+V', group: 'Edit' },
  { id: 'select-all', label: 'Select all', shortcut: 'Ctrl+A', group: 'Edit' },
  { id: 'find', label: 'Find', shortcut: 'Ctrl+F', group: 'Edit' },
  { id: 'replace', label: 'Replace', shortcut: 'Ctrl+H', group: 'Edit' },
  { id: 'goto-line', label: 'Go to line', shortcut: 'Ctrl+G', group: 'Edit' },
  { id: 'toggle-preview', label: 'Markdown preview', group: 'View' },
  { id: 'toggle-theme', label: 'Next theme', shortcut: 'Ctrl+Shift+T', group: 'View' },
  ...THEMES.map((item) => ({ id: item.command, label: item.label, group: 'View' as const })),
  { id: 'toggle-wrap', label: 'Toggle word wrap', shortcut: 'Alt+Z', group: 'View' },
  { id: 'font-larger', label: 'Larger text', shortcut: 'Ctrl+=', group: 'View' },
  { id: 'font-smaller', label: 'Smaller text', shortcut: 'Ctrl+-', group: 'View' },
  { id: 'settings', label: 'Settings', shortcut: 'Ctrl+,', group: 'File' },
  { id: 'shortcuts', label: 'Keyboard shortcuts', shortcut: 'Ctrl+/', group: 'View' }
]

interface PaletteProps {
  onClose: () => void
  onRun: (id: MenuCommand) => void
}

export function CommandPalette({ onClose, onRun }: PaletteProps) {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return COMMANDS.filter((item) => item.label.toLowerCase().includes(needle))
  }, [query])

  useEffect(() => {
    setIndex(0)
  }, [query])

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="palette" onMouseDown={(event) => event.stopPropagation()}>
        <input
          autoFocus
          placeholder="Type a command…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onClose()
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setIndex((value) => Math.min(matches.length - 1, value + 1))
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault()
              setIndex((value) => Math.max(0, value - 1))
            }
            if (event.key === 'Enter' && matches[index]) {
              onRun(matches[index].id)
              onClose()
            }
          }}
        />
        <div className="palette-list">
          {matches.map((item, itemIndex) => (
            <button
              key={item.id + item.label}
              className={`palette-item${itemIndex === index ? ' active' : ''}`}
              onClick={() => {
                onRun(item.id)
                onClose()
              }}
            >
              <span>
                <em className="palette-group">{item.group}</em>
                {item.label}
              </span>
              {item.shortcut && <span className="kbd">{item.shortcut}</span>}
            </button>
          ))}
          {matches.length === 0 && <p className="empty-note">No matching commands.</p>}
        </div>
      </div>
    </div>
  )
}

interface SettingsProps {
  settings: AppSettings
  notesDir: string
  onChange: (settings: AppSettings) => void
  onShowNotes: () => void
  onClose: () => void
}

export function SettingsPanel({ settings, notesDir, onChange, onShowNotes, onClose }: SettingsProps) {
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="settings-panel" onMouseDown={(event) => event.stopPropagation()}>
        <h2>Settings</h2>
        <label className="field">
          <span>Theme</span>
          <select
            value={normalizeTheme(settings.theme)}
            onChange={(event) => onChange({ ...settings, theme: event.target.value as ThemePreference })}
          >
            {THEMES.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Word wrap</span>
          <input
            type="checkbox"
            checked={settings.wordWrap}
            onChange={(event) => onChange({ ...settings, wordWrap: event.target.checked })}
          />
        </label>
        <label className="field">
          <span>Editor size</span>
          <input
            type="range"
            min={12}
            max={22}
            value={settings.fontSize}
            onChange={(event) => onChange({ ...settings, fontSize: Number(event.target.value) })}
          />
        </label>
        <div className="field">
          <span>Notes folder</span>
          <button className="ghost-btn" onClick={onShowNotes}>Open</button>
        </div>
        <p className="empty-note">{notesDir}</p>
        <div className="confirm-actions">
          <button className="ghost-btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}

export function ShortcutsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="shortcuts" onMouseDown={(event) => event.stopPropagation()}>
        <h2>Shortcuts</h2>
        {COMMANDS.filter((item) => item.shortcut).map((item) => (
          <div className="shortcut-row" key={item.id}>
            <span>{item.label}</span>
            <span className="kbd">{item.shortcut}</span>
          </div>
        ))}
        <div className="confirm-actions">
          <button className="ghost-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

interface ConfirmProps {
  title: string
  body: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, body, confirmLabel = 'Confirm', onConfirm, onCancel }: ConfirmProps) {
  return (
    <div className="overlay" onMouseDown={onCancel}>
      <div className="confirm" onMouseDown={(event) => event.stopPropagation()}>
        <h2>{title}</h2>
        <p>{body}</p>
        <div className="confirm-actions">
          <button className="ghost-btn" onClick={onCancel}>Cancel</button>
          <button className="primary-btn" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
