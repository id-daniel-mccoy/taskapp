import { useMemo } from 'react'
import { formatRepeat, pad2, uses12HourClock, WEEKDAYS } from '@shared/alarm-time'
import type { Alarm, AlarmSound } from '@shared/types'
import { AlarmClockFace } from './AlarmClockFace'
import { IconChevronDown, IconChevronUp, IconPause, IconPlay } from '../lib/icons'

interface Props {
  alarm: Alarm | null
  sounds: AlarmSound[]
  previewing: string | null
  onChange: (id: string, patch: Partial<Alarm>, immediate?: boolean) => void
  onPreview: (path: string) => void
  onDelete: (id: string) => void
}

const SNOOZE = [5, 10, 15, 20, 30]

function wrapHour(hour: number, delta: number): number {
  return (hour + delta + 24) % 24
}

function wrapMinute(minute: number, delta: number): number {
  return (minute + delta + 60) % 60
}

function displayHour(hour: number, twelve: boolean): string {
  if (!twelve) return pad2(hour)
  return String(hour % 12 || 12)
}

export function AlarmEditor({ alarm, sounds, previewing, onChange, onPreview, onDelete }: Props) {
  const twelve = uses12HourClock()
  const selectedSound = useMemo(
    () => (alarm ? sounds.find((item) => item.path === alarm.soundPath) : null),
    [alarm, sounds]
  )

  if (!alarm) {
    return (
      <div className="alarm-stage">
        <div className="alarm-empty">
          <div className="alarm-clock is-idle">
            <AlarmClockFace hour={7} minute={0} />
          </div>
          <h1>Alarms</h1>
          <p>Set a time and a tone. It will ring even after you close this window.</p>
        </div>
      </div>
    )
  }

  const period = alarm.hour < 12 ? 'AM' : 'PM'

  return (
    <div className="alarm-stage">
      <div className="alarm-editor">
        <div
          className="alarm-hero"
          onWheel={(event) => {
            event.preventDefault()
            const delta = event.deltaY > 0 ? 1 : -1
            if (event.shiftKey) onChange(alarm.id, { hour: wrapHour(alarm.hour, delta) })
            else onChange(alarm.id, { minute: wrapMinute(alarm.minute, delta) })
          }}
        >
          <div className="alarm-clock">
            <AlarmClockFace hour={alarm.hour} minute={alarm.minute} />
          </div>
          <div className="alarm-digital">
            <div className="alarm-time-pair">
              <button type="button" aria-label="Hour up" onClick={() => onChange(alarm.id, { hour: wrapHour(alarm.hour, 1) })}>
                <IconChevronUp width={16} height={16} />
              </button>
              <strong>{displayHour(alarm.hour, twelve)}</strong>
              <button type="button" aria-label="Hour down" onClick={() => onChange(alarm.id, { hour: wrapHour(alarm.hour, -1) })}>
                <IconChevronDown width={16} height={16} />
              </button>
            </div>
            <span className="alarm-colon">:</span>
            <div className="alarm-time-pair">
              <button type="button" aria-label="Minute up" onClick={() => onChange(alarm.id, { minute: wrapMinute(alarm.minute, 1) })}>
                <IconChevronUp width={16} height={16} />
              </button>
              <strong>{pad2(alarm.minute)}</strong>
              <button type="button" aria-label="Minute down" onClick={() => onChange(alarm.id, { minute: wrapMinute(alarm.minute, -1) })}>
                <IconChevronDown width={16} height={16} />
              </button>
            </div>
            {twelve && (
              <div className="alarm-period">
                <button
                  type="button"
                  className={period === 'AM' ? 'on' : ''}
                  onClick={() => onChange(alarm.id, { hour: alarm.hour % 12 }, true)}
                >
                  AM
                </button>
                <button
                  type="button"
                  className={period === 'PM' ? 'on' : ''}
                  onClick={() => onChange(alarm.id, { hour: (alarm.hour % 12) + 12 }, true)}
                >
                  PM
                </button>
              </div>
            )}
          </div>
          <p className="alarm-hero-caption">{formatRepeat(alarm.days)}</p>
        </div>

        <label className="alarm-field alarm-name">
          <span>Name</span>
          <input
            value={alarm.label}
            maxLength={80}
            onChange={(event) => onChange(alarm.id, { label: event.target.value })}
            onBlur={(event) => onChange(alarm.id, { label: event.target.value.trim() || 'Alarm' }, true)}
          />
        </label>

        <div className="alarm-field alarm-days">
          <span>Repeat</span>
          <div className="alarm-day-pills">
            {WEEKDAYS.map((item) => {
              const on = alarm.days.includes(item.day)
              return (
                <button
                  key={item.day}
                  type="button"
                  className={on ? 'on' : ''}
                  aria-pressed={on}
                  title={item.label}
                  onClick={() => {
                    const days = on
                      ? alarm.days.filter((day) => day !== item.day)
                      : [...alarm.days, item.day]
                    onChange(alarm.id, { days }, true)
                  }}
                >
                  {item.short}
                </button>
              )
            })}
          </div>
        </div>

        <div className="alarm-field">
          <span>Snooze</span>
          <div className="alarm-snooze">
            {SNOOZE.map((minutes) => (
              <button
                key={minutes}
                type="button"
                className={alarm.snoozeMinutes === minutes ? 'on' : ''}
                onClick={() => onChange(alarm.id, { snoozeMinutes: minutes }, true)}
              >
                {minutes}m
              </button>
            ))}
          </div>
        </div>

        <div className="alarm-field alarm-sounds">
          <span>Sound{selectedSound ? ` · ${selectedSound.name}` : ''}</span>
          <div className="alarm-sound-list">
            {sounds.length === 0 && (
              <p className="empty-note">No OS alarm tones were found. GNOME Clocks keeps them in /usr/share/sounds/gnome/default/alarms.</p>
            )}
            {sounds.map((sound) => {
              const selected = sound.path === alarm.soundPath
              const playing = previewing === sound.path
              return (
                <div key={sound.path} className={`alarm-sound${selected ? ' selected' : ''}${playing ? ' playing' : ''}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(alarm.id, { soundPath: sound.path }, true)
                      onPreview(sound.path)
                    }}
                  >
                    <strong>{sound.name}</strong>
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={playing ? `Stop ${sound.name}` : `Preview ${sound.name}`}
                    onClick={() => onPreview(sound.path)}
                  >
                    {playing ? <IconPause /> : <IconPlay />}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="alarm-editor-actions">
          <button type="button" className="ghost-btn danger-btn" onClick={() => onDelete(alarm.id)}>
            Delete alarm
          </button>
        </div>
      </div>
    </div>
  )
}
