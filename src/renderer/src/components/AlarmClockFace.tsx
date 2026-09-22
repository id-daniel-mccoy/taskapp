import { useId } from 'react'

const TICKS = Array.from({ length: 60 }, (_, index) => index)

export function AlarmClockFace({ hour, minute, className = '' }: { hour: number; minute: number; className?: string }) {
  const washId = useId().replace(/:/g, '')
  const minuteAngle = minute * 6
  const hourAngle = (hour % 12) * 30 + minute * 0.5
  const radius = 104
  const circumference = 2 * Math.PI * radius
  const minuteArc = (minute / 60) * circumference

  return (
    <svg className={`alarm-clock-face ${className}`.trim()} viewBox="0 0 240 240" aria-hidden="true">
      <defs>
        <radialGradient id={washId} cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.14" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle className="alarm-clock-rim" cx="120" cy="120" r="116" />
      <circle className="alarm-clock-wash" cx="120" cy="120" r="114" fill={`url(#${washId})`} />
      <circle className="alarm-clock-track" cx="120" cy="120" r={radius} />
      <circle
        className="alarm-clock-arc"
        cx="120"
        cy="120"
        r={radius}
        strokeDasharray={`${minuteArc} ${circumference}`}
        transform="rotate(-90 120 120)"
      />
      {TICKS.map((tick) => {
        const hourMark = tick % 5 === 0
        const cardinal = tick % 15 === 0
        return (
          <line
            key={tick}
            className={`alarm-clock-tick${hourMark ? ' is-hour' : ''}${cardinal ? ' is-cardinal' : ''}`}
            x1="120"
            y1={cardinal ? 12 : hourMark ? 16 : 20}
            x2="120"
            y2={hourMark ? 30 : 26}
            transform={`rotate(${tick * 6} 120 120)`}
          />
        )
      })}
      <text className="alarm-clock-num" x="120" y="48">
        12
      </text>
      <text className="alarm-clock-num" x="192" y="126">
        3
      </text>
      <text className="alarm-clock-num" x="120" y="204">
        6
      </text>
      <text className="alarm-clock-num" x="48" y="126">
        9
      </text>
      <line className="alarm-clock-hand is-hour" x1="120" y1="128" x2="120" y2="68" transform={`rotate(${hourAngle} 120 120)`} />
      <line className="alarm-clock-hand is-minute" x1="120" y1="132" x2="120" y2="40" transform={`rotate(${minuteAngle} 120 120)`} />
      <circle className="alarm-clock-cap" cx="120" cy="120" r="6" />
    </svg>
  )
}
