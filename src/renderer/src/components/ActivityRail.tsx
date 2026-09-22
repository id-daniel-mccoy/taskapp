import { IconAlarm, IconBell, IconNotes, IconTasks } from '../lib/icons'

interface Props {
  section: 'notes' | 'alarms'
  onNotes: () => void
  onAlarms: () => void
}

const railIcon = { width: 22, height: 22 }

export function ActivityRail({ section, onNotes, onAlarms }: Props) {
  return (
    <nav className="rail" aria-label="Taskapp sections">
      <button
        type="button"
        className={`rail-btn${section === 'notes' ? ' active' : ''}`}
        title="Notes"
        aria-label="Notes"
        aria-pressed={section === 'notes'}
        onClick={onNotes}
      >
        <IconNotes {...railIcon} />
      </button>
      <button
        type="button"
        className={`rail-btn${section === 'alarms' ? ' active' : ''}`}
        title="Alarms"
        aria-label="Alarms"
        aria-pressed={section === 'alarms'}
        onClick={onAlarms}
      >
        <IconAlarm {...railIcon} />
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
