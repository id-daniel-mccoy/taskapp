import { formatAlarmTime, formatNextFire, formatRepeat, nextOccurrence } from '@shared/alarm-time'
import type { Alarm } from '@shared/types'
import { IconButton } from './IconButton'
import { IconPlus } from '../lib/icons'

interface Props {
  alarms: Alarm[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onToggle: (id: string, enabled: boolean) => void
  collapsed?: boolean
}

export function AlarmsList({ alarms, activeId, onSelect, onNew, onToggle, collapsed = false }: Props) {
  return (
    <aside
      className="notes-list alarms-list"
      aria-hidden={collapsed}
      {...(collapsed ? { inert: '' } : {})}
    >
      <div className="notes-list-head">
        <h2>Alarms</h2>
        <IconButton label="New alarm" onClick={onNew}>
          <IconPlus />
        </IconButton>
      </div>
      {alarms.length === 0 ? (
        <p className="empty-note">No alarms yet. Create one and it will ring even if Taskapp is closed.</p>
      ) : (
        <div className="notes-list-body">
          {alarms.map((alarm) => {
            const when = nextOccurrence(alarm.hour, alarm.minute, alarm.days)
            return (
              <div
                key={alarm.id}
                className={`note-item alarm-item${alarm.id === activeId ? ' active' : ''}${alarm.enabled ? '' : ' is-off'}`}
              >
                <button className="note-item-main alarm-item-main" onClick={() => onSelect(alarm.id)}>
                  <strong>{formatAlarmTime(alarm.hour, alarm.minute)}</strong>
                  <em>
                    {alarm.label}
                    <span> · {formatRepeat(alarm.days)}</span>
                  </em>
                  {alarm.enabled && <span className="alarm-next">{formatNextFire(when)}</span>}
                </button>
                <button
                  type="button"
                  className={`alarm-switch${alarm.enabled ? ' on' : ''}`}
                  role="switch"
                  aria-checked={alarm.enabled}
                  aria-label={alarm.enabled ? 'Turn alarm off' : 'Turn alarm on'}
                  onClick={(event) => {
                    event.stopPropagation()
                    onToggle(alarm.id, !alarm.enabled)
                  }}
                >
                  <span />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </aside>
  )
}
