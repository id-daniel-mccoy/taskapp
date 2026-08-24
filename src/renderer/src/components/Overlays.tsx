import { useEffect, useMemo, useState } from 'react'
import type { AppSettings, MenuCommand, ThemePreference } from '@shared/types'

interface Command {
  id: MenuCommand | 'new' | 'open'
  label: string
  shortcut?: string
}

const COMMANDS: Command[] = [
  { id: 'new', label: 'New note', shortcut: 'Ctrl+N' },
  { id: 'open', label: 'Open file', shortcut: 'Ctrl+O' },
  { id: 'save', label: 'Save', shortcut: 'Ctrl+S' },
  { id: 'save-as', label: 'Save as…', shortcut: 'Ctrl+Shift+S' },
  { id: 'find', label: 'Find in note', shortcut: 'Ctrl+F' },
  { id: 'toggle-theme', label: 'Toggle theme', shortcut: 'Ctrl+Shift+T' },
  { id: 'toggle-wrap', label: 'Toggle word wrap', shortcut: 'Alt+Z' },
  { id: 'format-json', label: 'Format JSON' },
  { id: 'minify-json', label: 'Minify JSON' },
  { id: 'validate-json', label: 'Validate JSON' },
  { id: 'show-in-folder', label: 'Show in folder' },
  { id: 'settings', label: 'Settings', shortcut: 'Ctrl+,' },
  { id: 'shortcuts', label: 'Keyboard shortcuts', shortcut: 'Ctrl+/' }
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
              onRun(matches[index].id as MenuCommand)
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
                onRun(item.id as MenuCommand)
                onClose()
              }}
            >
              <span>{item.label}</span>
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
  onChange: (settings: AppSettings) => void
  onClose: () => void
}

export function SettingsPanel({ settings, onChange, onClose }: SettingsProps) {
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="settings-panel" onMouseDown={(event) => event.stopPropagation()}>
        <h2>Settings</h2>
        <label className="field">
          <span>Theme</span>
          <select
            value={settings.theme}
            onChange={(event) => onChange({ ...settings, theme: event.target.value as ThemePreference })}
          >
            <option value="system">System</option>
            <option value="ink">Ink</option>
            <option value="paper">Paper</option>
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
  onSave: () => void
  onDiscard: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, body, onSave, onDiscard, onCancel }: ConfirmProps) {
  return (
    <div className="overlay" onMouseDown={onCancel}>
      <div className="confirm" onMouseDown={(event) => event.stopPropagation()}>
        <h2>{title}</h2>
        <p>{body}</p>
        <div className="confirm-actions">
          <button className="ghost-btn" onClick={onCancel}>Cancel</button>
          <button className="ghost-btn" onClick={onDiscard}>Discard</button>
          <button className="primary-btn" onClick={onSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
