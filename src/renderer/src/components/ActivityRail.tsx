import { IconBell, IconNotes, IconTasks } from '../lib/icons'

export function ActivityRail() {
  return (
    <nav className="rail" aria-label="Taskapp sections">
      <button className="rail-btn active" title="Notes">
        <IconNotes />
      </button>
      <button className="rail-btn" disabled title="Tasks">
        <IconTasks />
        <span className="soon">Tasks — coming next</span>
      </button>
      <button className="rail-btn" disabled title="Reminders">
        <IconBell />
        <span className="soon">Reminders — coming next</span>
      </button>
    </nav>
  )
}
