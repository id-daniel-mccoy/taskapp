import { formatAlarmTime } from '@shared/alarm-time'
import type { Alarm } from '@shared/types'
import { AlarmClockFace } from './AlarmClockFace'

interface Props {
  alarm: Alarm
  onStop: () => void
  onSnooze: () => void
}

export function AlarmOverlay({ alarm, onStop, onSnooze }: Props) {
  return (
    <div className="alarm-ring" role="alertdialog" aria-label="Alarm">
      <div className="alarm-ring-card">
        <div className="alarm-clock is-ringing">
          <AlarmClockFace hour={alarm.hour} minute={alarm.minute} />
        </div>
        <p className="alarm-ring-kicker">{alarm.label || 'Alarm'}</p>
        <h1>{formatAlarmTime(alarm.hour, alarm.minute)}</h1>
        <div className="alarm-ring-actions">
          <button type="button" className="ghost-btn" onClick={onSnooze}>
            Snooze {alarm.snoozeMinutes} min
          </button>
          <button type="button" className="primary-btn" onClick={onStop}>
            Stop
          </button>
        </div>
      </div>
    </div>
  )
}
