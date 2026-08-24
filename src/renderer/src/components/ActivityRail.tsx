import { IconBell, IconNotes, IconTasks } from '../lib/icons'

interface Props {
  notesOpen: boolean
  onToggleNotes: () => void
}

const railIcon = { width: 22, height: 22 }

export function ActivityRail({ notesOpen, onToggleNotes }: Props) {
  return (
    <nav className="rail" aria-label="Taskapp sections">
      <button
        type="button"
        className={`rail-btn${notesOpen ? ' active' : ''}`}
        title={notesOpen ? 'Hide notes' : 'Show notes'}
        aria-label="Notes"
        aria-expanded={notesOpen}
        aria-pressed={notesOpen}
        onClick={onToggleNotes}
      >
        <IconNotes {...railIcon} />
      </button>
      <button className="rail-btn" disabled title="Tasks">
        <IconTasks {...railIcon} />
        <span className="soon">Tasks — coming next</span>
      </button>
      <button className="rail-btn" disabled title="Reminders">
        <IconBell {...railIcon} />
        <span className="soon">Reminders — coming next</span>
      </button>
    </nav>
  )
}
