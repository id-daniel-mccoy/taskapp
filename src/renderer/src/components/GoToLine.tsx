import { useEffect, useRef, useState } from 'react'
import { parseLineColumn } from '@shared/text'

interface Props {
  open: boolean
  onClose: () => void
  onGo: (line: number, column: number) => void
}

export function GoToLine({ open, onClose, onGo }: Props) {
  const field = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')

  useEffect(() => {
    if (!open) return
    setValue('')
    window.setTimeout(() => field.current?.select(), 0)
  }, [open])

  if (!open) return null

  return (
    <div className="overlay" onMouseDown={onClose}>
      <form
        className="goto-panel"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          const parsed = parseLineColumn(value)
          if (!parsed) return
          onGo(parsed.line, parsed.column)
          onClose()
        }}
      >
        <h2>Go to line</h2>
        <input
          ref={field}
          value={value}
          placeholder="12 or 12:4"
          aria-label="Line and column"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              onClose()
            }
          }}
        />
        <div className="confirm-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-btn">Go</button>
        </div>
      </form>
    </div>
  )
}
