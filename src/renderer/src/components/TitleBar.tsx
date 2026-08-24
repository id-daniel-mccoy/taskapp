import icon from '../assets/icon.png'
import { IconFolder, IconMax, IconMin, IconMoon, IconPlus, IconSave, IconSearch, IconSettings, IconSun, IconX } from '../lib/icons'
import type { WorkspaceDocument } from '../hooks/useWorkspace'

interface Props {
  active: WorkspaceDocument | null
  theme: 'ink' | 'paper'
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onPalette: () => void
  onTheme: () => void
  onSettings: () => void
}

export function TitleBar({ active, theme, onNew, onOpen, onSave, onPalette, onTheme, onSettings }: Props) {
  return (
    <header className="titlebar">
      <div className="titlebar-brand">
        <img src={icon} alt="" />
      </div>
      <div className="titlebar-center">
        <strong>{active ? `${active.dirty ? '• ' : ''}${active.name}` : 'Taskapp'}</strong>
        <span>{active?.path ?? (active ? 'Unsaved note' : 'Notes first. Tasks next.')}</span>
      </div>
      <div className="titlebar-actions">
        <button className="icon-btn" title="New note" onClick={onNew}><IconPlus /></button>
        <button className="icon-btn" title="Open" onClick={onOpen}><IconFolder /></button>
        <button className="icon-btn" title="Save" onClick={onSave}><IconSave /></button>
        <button className="icon-btn" title="Command palette" onClick={onPalette}><IconSearch /></button>
        <button className="icon-btn" title="Toggle theme" onClick={onTheme}>
          {theme === 'ink' ? <IconSun /> : <IconMoon />}
        </button>
        <button className="icon-btn" title="Settings" onClick={onSettings}><IconSettings /></button>
        <div className="window-controls">
          <button className="window-btn" title="Minimize" onClick={() => window.taskapp.minimize()}><IconMin /></button>
          <button className="window-btn" title="Maximize" onClick={() => window.taskapp.maximize()}><IconMax /></button>
          <button className="window-btn close" title="Close" onClick={() => window.taskapp.close()}><IconX /></button>
        </div>
      </div>
    </header>
  )
}
